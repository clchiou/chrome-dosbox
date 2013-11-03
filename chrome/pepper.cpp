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

#include <nacl_io/nacl_io.h>


#define DEBUG "DEBUG"
#define INFO  "INFO"
#define WARN  "WARN"
#define ERROR "ERROR"

#define LOG(level, fmt, args...) fprintf(stderr, "%s:%s:%s:%d: " fmt "\n", \
    level, __FILE__, __func__, __LINE__, ##args)


class Instance : public pp::Instance {
 public:
  explicit Instance(PP_Instance instance);

  virtual ~Instance();

  virtual bool Init(uint32_t argc, const char* argn[], const char* argv[]);

  void DidChangeView(const pp::Rect& position, const pp::Rect& clip);

  bool HandleInputEvent(const pp::InputEvent& event);

 private:
  static void* Trampoline(void* self);
  bool Main();

  static bool MakeDirectory(const char* path);

  pthread_t thread_;

  int width_;
  int height_;
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


Instance::Instance(PP_Instance instance)
    : pp::Instance(instance), thread_(0), width_(0), height_(0) {
  LOG(INFO, "Construct instance");
  RequestInputEvents(PP_INPUTEVENT_CLASS_MOUSE);
  RequestFilteringInputEvents(PP_INPUTEVENT_CLASS_KEYBOARD);
}


Instance::~Instance() {
  if (thread_)
    pthread_join(thread_, NULL);
}


bool Instance::Init(uint32_t argc, const char* argn[], const char* argv[]) {
  nacl_io_init_ppapi(pp_instance(),
                     pp::Module::Get()->get_browser_interface());
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
  int err = pthread_create(&thread_, NULL, Trampoline, this);
  if (err) {
    LOG(ERROR, "Could not create thread: err=%d", err);
    return;
  }
}


bool Instance::HandleInputEvent(const pp::InputEvent& event) {
  SDL_NACL_PushEvent(event);
  return true;
}


void* Instance::Trampoline(void* self) {
  static_cast<Instance*>(self)->Main();
  return NULL;
}


bool Instance::Main() {
  LOG(INFO, "Mount file system");
  if (umount("/")) {
    LOG(ERROR, "Could not umount root directory: %s", strerror(errno));
    return false;
  }
  if (mount("", "/", "memfs", 0, "")) {
    LOG(ERROR, "Could not re-mount root directory: %s", strerror(errno));
    return false;
  }

  // TODO(clchiou): Figure out why html5fs doesn't work; I highly suspect that
  // nacl_io does not implement that yet :(
#if 0
  // 1073741824 = 1 GB
  const char* mount_data = "type=PERSISTENT,expected_size=1073741824";
  if (mount("", "/data", "html5fs", 0, mount_data)) {
    LOG(ERROR, "Could not mount /data: %s", strerror(errno));
    return false;
  }
#endif
  if (!MakeDirectory("/data")) {
    LOG(ERROR, "Could not make directory /data");
    return false;
  }

  if (!MakeDirectory("/data/c_drive")) {
    LOG(ERROR, "Could not make directory /data/c_drive");
    return false;
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

  LOG(DEBUG, "argc=%d", argc);
  for (int i = 0; i < argc; i++) {
    LOG(DEBUG, "argv[%d]=%s", i, argv[i]);
  }
  LOG(DEBUG, "argv[%d]=%p", argc, argv[argc]);

  int ret = SDL_main(argc, argv);
  LOG(ret ? ERROR : INFO, "SDL_main() returns %d", ret);
  return ret ? false : true;
}


bool Instance::MakeDirectory(const char* path) {
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
