// Copyright (C) 2013 Che-Liang Chiou.

extern "C" {

#include <assert.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/timeb.h>
#include <sys/types.h>

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

/* XXX: lstat(2) is not implemented; override it with stat(2) instead. */
int lstat(const char *path, struct stat *buf) {
  return stat(path, buf);
}

}
