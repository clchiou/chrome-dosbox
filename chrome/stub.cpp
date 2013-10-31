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
