// Copyright (C) 2013 Che-Liang Chiou.

#include <sys/mount.h>

int ChromeAppInit(int* argc_ptr, char** argv_ptr[]) {
  umount("/");
  mount("", "/", "memfs", 0, "");
  return 0;
}
