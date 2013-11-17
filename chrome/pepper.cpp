// Copyright (C) 2013 Che-Liang Chiou.

#include <errno.h>
#include <pthread.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/types.h>

#include <SDL/SDL.h>
#include <SDL/SDL_nacl.h>
#include <SDL/SDL_video.h>
#include <SDL/SDL_main.h>

#include <ppapi/cpp/input_event.h>
#include <ppapi/cpp/instance.h>
#include <ppapi/cpp/module.h>
#include <ppapi/cpp/rect.h>
#include <ppapi/cpp/var.h>

#include <nacl_io/nacl_io.h>

#include "log.h"
#include "message_queue.h"


class Instance : public pp::Instance {
 public:
  explicit Instance(PP_Instance instance);

  virtual ~Instance();

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]);

  virtual void DidChangeView(const pp::Rect& position, const pp::Rect& clip);

  virtual bool HandleInputEvent(const pp::InputEvent& event);

  virtual void HandleMessage(const pp::Var& message);

 private:
  typedef bool (Instance::*MainFunction)();

  struct TrampolineBlob {
    Instance* self_;
    MainFunction main_;
  };

  static void* Trampoline(void* blob);

  int LaunchThread(pthread_t* thread, MainFunction main);

  bool MessageLoop();
  pthread_t message_thread_;

  bool SdlMain();
  pthread_t sdl_thread_;

  int width_;
  int height_;

  MessageQueue message_queue_;
};


class Module : public pp::Module {
 public:
  Module() : pp::Module() {}
  virtual ~Module() {}

  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new Instance(instance);
  }
};


namespace pp {
  Module* CreateModule() {
    LOG(INFO, "Create module");
    return new ::Module();
  }
} // namespace pp


static bool MountAndMakeDirectory(const char* root, const char* dirname);

static bool MakeDirectory(const char* path);


Instance::Instance(PP_Instance instance)
    : pp::Instance(instance), message_thread_(0),
      sdl_thread_(0), width_(0), height_(0) {
  LOG(INFO, "Construct instance");
  RequestInputEvents(PP_INPUTEVENT_CLASS_MOUSE);
  RequestFilteringInputEvents(PP_INPUTEVENT_CLASS_KEYBOARD);
}


Instance::~Instance() {
  if (message_thread_)
    pthread_join(message_thread_, NULL);
  if (sdl_thread_)
    pthread_join(sdl_thread_, NULL);
}


bool Instance::Init(uint32_t argc, const char* argn[], const char* argv[]) {
  nacl_io_init_ppapi(pp_instance(),
                     pp::Module::Get()->get_browser_interface());

  int err = LaunchThread(&message_thread_, &Instance::MessageLoop);
  if (err) {
    LOG(ERROR, "Could not create message_thread_: err=%d", err);
    return false;
  }

  return true;
}


void Instance::DidChangeView(const pp::Rect& position, const pp::Rect& clip) {
  if (width_ && height_)
    return;

  if (position.size().width() == width_ && position.size().height() == height_)
    return; // Size didn't change, no need to update anything.

  width_ = position.size().width();
  height_ = position.size().height();

  SDL_NACL_SetInstance(pp_instance(), width_, height_);
  int err = LaunchThread(&sdl_thread_, &Instance::SdlMain);
  if (err) {
    LOG(ERROR, "Could not create sdl_thread_: err=%d", err);
    return;
  }
}


bool Instance::HandleInputEvent(const pp::InputEvent& event) {
  SDL_NACL_PushEvent(event);
  return true;
}


void Instance::HandleMessage(const pp::Var& message) {
  if (!message.is_string()) {
    LOG(ERROR, "Message is not a string");
    return;
  }
  message_queue_.add(StringToMessage(message.AsString()));
}


int Instance::LaunchThread(pthread_t* thread, MainFunction main) {
  TrampolineBlob* blob = new TrampolineBlob();
  blob->self_ = this;
  blob->main_ = main;
  return pthread_create(thread, NULL, Trampoline, blob);
}


void* Instance::Trampoline(void* blob) {
  TrampolineBlob *b = static_cast<TrampolineBlob*>(blob);
  (b->self_->*b->main_)();
  delete b;
  return NULL;
}


bool Instance::MessageLoop() {
  LOG(INFO, "Enter message loop");
  Message message;
  for (;;) {
    message_queue_.pop(&message);
    std::string type = message.get<std::string>("type", "");
    std::string action = message.get<std::string>("action", "");
    if (type == "sys") {
      if (action == "quit") {
        LOG(INFO, "Quitting...");
        PostMessage(pp::Var(MessageToString(message)));
        break;
      } else if (action == "log") {
        PostMessage(pp::Var(MessageToString(message)));
        continue;
      }
    }
    std::string message_str = MessageToString(message);
    LOG(WARN, "Could not parse message: %s", message_str.c_str());
  }
  LOG(INFO, "Quit message loop");
  return true;
}


bool Instance::SdlMain() {
  LOG(INFO, "Mount file system");
  if (umount("/")) {
    LOG(ERROR, "Could not umount root directory: %s", strerror(errno));
    return false;
  }
  if (mount("", "/", "memfs", 0, "")) {
    LOG(ERROR, "Could not re-mount root directory: %s", strerror(errno));
    return false;
  }
  if (!MountAndMakeDirectory("/data", "c_drive")) {
    // Okay, try making directories in memfs...
    if (!MakeDirectory("/data"))
      return false;
    if (!MakeDirectory("/data/c_drive"))
      return false;
    LOG(INFO, "Use memfs for /data/c_drive");
    Message message;
    message.put("type", "sys");
    message.put("action", "log");
    message.put("level", "warning");
    message.put("message", "Could not use html5fs; fall back to memfs.");
    message_queue_.add(message);
  }

  LOG(INFO, "Call SDL_main()");
  char args[] = "dosbox /data/c_drive";
  char* argv[3];
  int argc = 0;
  char* str = args;
  while (argv[argc] = strtok(str, " ")) {
    str = NULL;
    argc++;
    assert(argc < sizeof(argv) / sizeof(argv[0]));
  }

  int ret = SDL_main(argc, argv);
  Message message;
  message.put("type", "sys");
  message.put("action", "quit");
  message.put("value", ret);
  message_queue_.add(message);
  LOG(ret ? ERROR : INFO, "SDL_main() returns %d", ret);
  return ret ? false : true;
}


static bool MountAndMakeDirectory(const char* root, const char* dirname) {
  char mount_args[256];
  snprintf(mount_args, sizeof(mount_args), "type=PERSISTENT,expected_size=%d",
      1024 * 1024 * 1024);
  if (mount("", root, "html5fs", 0, mount_args)) {
    LOG(ERROR, "Could not mount %s: %s", root, strerror(errno));
    return false;
  }

  char path[256];
  snprintf(path, sizeof(path), "%s/%s", root, dirname);
  if (!MakeDirectory(path)) {
    LOG(ERROR, "Could not make directory %s", path);
    if (umount(root)) {
      LOG(ERROR, "Could not umount %s: %s", root, strerror(errno));
    }
    return false;
  }

  return true;
}


static bool MakeDirectory(const char* path) {
  struct stat buf;
  if (!stat(path, &buf)) {
    if (!S_ISDIR(buf.st_mode)) {
      LOG(DEBUG, "It is not a directory: path=%s", path);
    }
    return S_ISDIR(buf.st_mode);
  }

  if (errno != ENOENT) {
    LOG(DEBUG, "stat(): %s", strerror(errno));
    return false;
  }

  mode_t mode = 0755;
  if (mkdir(path, mode)) {
    LOG(DEBUG, "mkdir(\"%s\", %04o): %s", path, mode, strerror(errno));
    return false;
  }

  return true;
}
