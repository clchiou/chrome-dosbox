// Copyright (C) 2013 Che-Liang Chiou.

#include <algorithm>
#include <cctype>
#include <vector>

#include <assert.h>
#include <errno.h>
#include <pthread.h>
#include <stdio.h>
#include <string.h>
#include <sys/mount.h>

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

#include "count_down_latch.h"
#include "filesystem.h"
#include "log.h"
#include "message_queue.h"

const char* const DEFAULT_ARGS = "dosbox /data/c_drive";

const char* const DEFAULT_CONFIG =
    "# DOSBox configuration file\n"
    "[sdl]\n"
    "output=opengl\n";

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
  bool HandleSysMessage(const Message& message);
  bool HandleAppMessage(const Message& message);
  pthread_t message_thread_;
  bool exit_;

  bool SdlMain();
  pthread_t sdl_thread_;
  std::string args_;
  std::string config_;

  // Block on two events before running dosbox's main():
  // 1. DidChangeView is called.
  // 2. Receive "start" message from Javascript.
  static const int LATCH_VALUE = 2;
  CountDownLatch latch_;

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
}  // namespace pp

static void ParseArgs(const std::string& args, int* argc, char*** argv);
static void ReleaseArgs(int argc, char** argv);

static bool MountAndMakeDirectory(const char* root, const char* dirname);

Instance::Instance(PP_Instance instance)
    : pp::Instance(instance),
      message_thread_(0),
      exit_(false),
      sdl_thread_(0),
      args_(DEFAULT_ARGS),
      config_(DEFAULT_CONFIG),
      latch_(LATCH_VALUE),
      width_(0),
      height_(0) {
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
  nacl_io_init_ppapi(pp_instance(), pp::Module::Get()->get_browser_interface());

  int err;
  err = LaunchThread(&message_thread_, &Instance::MessageLoop);
  if (err) {
    LOG(ERROR, "Could not create message_thread_: err=%d", err);
    return false;
  }
  err = LaunchThread(&sdl_thread_, &Instance::SdlMain);
  if (err) {
    LOG(ERROR, "Could not create sdl_thread_: err=%d", err);
    return false;
  }

  return true;
}

void Instance::DidChangeView(const pp::Rect& position, const pp::Rect& clip) {
  if (width_ && height_)
    return;

  if (position.size().width() == width_ && position.size().height() == height_)
    return;  // Size didn't change, no need to update anything.

  width_ = position.size().width();
  height_ = position.size().height();

  SDL_NACL_SetInstance(pp_instance(),
                       pp::Module::Get()->get_browser_interface(),
                       width_,
                       height_);

  latch_.CountDown();
}

bool Instance::HandleInputEvent(const pp::InputEvent& event) {
  SDL_NACL_PushEvent(event.pp_resource());
  return true;
}

void Instance::HandleMessage(const pp::Var& message) {
  if (!message.is_string()) {
    LOG(ERROR, "Message is not a string");
    return;
  }
  message_queue_.Add(StringToMessage(message.AsString()));
}

int Instance::LaunchThread(pthread_t* thread, MainFunction main) {
  TrampolineBlob* blob = new TrampolineBlob();
  blob->self_ = this;
  blob->main_ = main;
  return pthread_create(thread, NULL, Trampoline, blob);
}

void* Instance::Trampoline(void* blob) {
  TrampolineBlob* b = static_cast<TrampolineBlob*>(blob);
  (b->self_->*b->main_)();
  delete b;
  return NULL;
}

bool Instance::MessageLoop() {
  LOG(INFO, "Enter message loop");
  Message message;
  while (!exit_) {
    message_queue_.Pop(&message);
    std::string type = message.get<std::string>("type", "");
    if (type == "sys" && HandleSysMessage(message)) {
      continue;
    }
    if (type == "app" && HandleAppMessage(message)) {
      continue;
    }
    std::string message_str = MessageToString(message);
    LOG(WARN, "Could not parse message: %s", message_str.c_str());
  }
  LOG(INFO, "Quit message loop");
  return true;
}

bool Instance::HandleSysMessage(const Message& message) {
  std::string action = message.get<std::string>("action", "");
  if (action == "quit") {
    LOG(INFO, "Quitting...");
    PostMessage(pp::Var(MessageToString(message)));
    exit_ = true;
  } else if (action == "log") {
    PostMessage(pp::Var(MessageToString(message)));
  } else {
    return false;
  }
  return true;
}

bool Instance::HandleAppMessage(const Message& message) {
  std::string action = message.get<std::string>("action", "");
  if (action == "start") {
    LOG(INFO, "Starting...");
    latch_.CountDown();
  } else if (action == "args") {
    std::string value = message.get<std::string>("value", "");
    LOG(INFO, "args=\"%s\" new_args=\"%s\"", args_.c_str(), value.c_str());
    args_ = value;
  } else if (action == "config") {
    std::string value = message.get<std::string>("value", "");
    LOG(INFO, "config=<<EOF\n%s\nEOF", config_.c_str());
    LOG(INFO, "new_config=<<EOF\n%s\nEOF", value.c_str());
    config_ = value;
  } else {
    return false;
  }
  return true;
}

bool Instance::SdlMain() {
  LOG(INFO, "Awaiting latch...");
  latch_.Await();

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
    message_queue_.Add(message);
  }

// TODO(clchiou): Complete memfs feature.
#if 0
  if (!MakeDirectory("/mem"))
    return false;
  if (!CopyDirectory("/data/c_drive", "/mem"))
    return false;
#endif

  // Create and write config file.
  if (MakeDirectory("/config")) {
    FILE* config = fopen("/config/dosbox-SVN.conf", "w");
    if (config) {
      fprintf(config, config_.c_str());
      fclose(config);
    }
  }

  int argc;
  char** argv;
  ParseArgs(args_, &argc, &argv);
  LOG(INFO, "main(): argc=%d", argc);
  for (int i = 0; i < argc; i++) {
    LOG(INFO, "  argv[%d]=\"%s\"", i, argv[i]);
  }

  int ret = SDL_main(argc, argv);
  ReleaseArgs(argc, argv);
  Message message;
  message.put("type", "sys");
  message.put("action", "quit");
  message.put("value", ret);
  message_queue_.Add(message);
  LOG(ret ? ERROR : INFO, "main() returns %d", ret);
  return ret ? false : true;
}

static void ParseArgs(const std::string& args, int* argc, char*** argv) {
  std::vector<char*> arguments;
  const char* p = args.c_str();
  while (*p) {
    while (*p && isspace(*p)) {
      p++;
    }
    if (!*p) {
      break;
    }
    const char* q = p;
    char quote = '\0';
    while (*q) {
      if (quote) {
        if (*q == quote && (q == p || q[-1] != '\\')) {
          quote = '\0';  // End of quotation.
        }
      } else if (*q == '\'' || *q == '"') {
        quote = *q;  // Start of quotation.
      } else if (isspace(*q)) {
        break;
      }
      q++;
    }
    if (p != q) {
      char* arg = new char[q - p + 1];
      strncpy(arg, p, q - p);
      arg[q - p] = '\0';
      arguments.push_back(arg);
    }
    p = q;
  }
  arguments.push_back(NULL);

  *argv = new char* [arguments.size()];
  *argc = arguments.size() - 1;  // Exclude the last NULL.
  std::copy(arguments.begin(), arguments.end(), *argv);
}

static void ReleaseArgs(int argc, char** argv) {
  for (int i = 0; i < argc; i++) {
    delete[] argv[i];
  }
  delete[] argv;
}

static bool MountAndMakeDirectory(const char* root, const char* dirname) {
  char mount_args[256];
  snprintf(mount_args,
           sizeof(mount_args),
           "type=PERSISTENT,expected_size=%d",
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
