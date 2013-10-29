// Copyright (C) 2013 Che-Liang Chiou.

extern "C" {

#include <stdio.h>
#include <assert.h>
#include <sys/timeb.h>

char *dirname(char *path) {
  fprintf(stderr, "ERROR: %s is not implemented\n", __func__);
  assert(0);
  return NULL;
}

int ftime(struct timeb *tp) {
  fprintf(stderr, "ERROR: %s is not implemented\n", __func__);
  assert(0);
  return 0;
}

}

#include <sys/mount.h>
#include "nacl_io/nacl_io.h"

void make_sure_we_link_to_these_functions(void) {
  nacl_io_init_ppapi(NULL, NULL);
  umount(NULL);
  mount(NULL, NULL, NULL, 0, NULL);
}
