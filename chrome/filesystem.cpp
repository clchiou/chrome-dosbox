// Copyright (C) 2013 Che-Liang Chiou.

#include "filesystem.h"

#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <sys/types.h>

#include "log.h"

static char* basename_unsafe(const char* path);

static char* dirname_unsafe(const char* path);

static char* join_unsafe(const char* dirname, const char* basename);

static bool exist(const char* path);

static bool isdir(const char* path);

static bool CopyDirectoryContents(const char* src, const char* dst);

static bool CopyFile(const char* src, const char* dst);

bool MakeDirectory(const char* path) {
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

bool CopyDirectory(const char* src, const char* parent) {
  const char* dst = join_unsafe(parent, basename_unsafe(src));
  if (exist(dst)) {
    LOG(ERROR, "Could not overwrite destination: %s", dst);
    return false;
  }

  if (!MakeDirectory(dst)) {
    LOG(ERROR, "Could not create destination: %s", dst);
    return false;
  }

  return CopyDirectoryContents(src, strdupa(dst));
}

static bool CopyDirectoryContents(const char* src, const char* dst) {
  bool okay = false;
  DIR* dir;

  dir = opendir(src);
  if (!dir) {
    LOG(DEBUG, "opendir(\"%s\"): %s", src, strerror(errno));
    goto exit;
  }

  // XXX: Ignore readdir() errors.
  while (struct dirent* entry = readdir(dir)) {
    const char* filename = entry->d_name;
    if (!strcmp(filename, ".") || !strcmp(filename, ".."))
      continue;
    const char* srcpath = strdupa(join_unsafe(src, filename));
    const char* dstpath = strdupa(join_unsafe(dst, filename));
    if (isdir(srcpath)) {
      if (!MakeDirectory(dstpath))
        goto close_src;
      if (!CopyDirectoryContents(srcpath, dstpath))
        goto close_src;
    } else {
      if (!CopyFile(srcpath, dstpath))
        goto close_src;
    }
  }

  okay = true;

close_src:
  closedir(dir);
exit:
  return okay;
}

static bool CopyFile(const char* src, const char* dst) {
  bool okay = false;
  int srcfd = -1;
  int dstfd = -1;

  srcfd = open(src, O_RDONLY);
  if (srcfd < 0) {
    LOG(ERROR, "open(\"%s\", O_RDONLY): %s", src, strerror(errno));
    goto exit;
  }

  dstfd = open(dst, O_WRONLY | O_CREAT, 0644);
  if (dstfd < 0) {
    LOG(ERROR, "open(\"%s\", O_WRONLY): %s", dst, strerror(errno));
    goto close_src;
  }

  char buf[512];
  ssize_t size;
  while ((size = read(srcfd, buf, sizeof(buf))) > 0) {
    char* p = buf;
    size_t towrite = size;
    ssize_t count;
    while ((count = write(dstfd, p, towrite)) > 0) {
      p += count;
      towrite -= count;
    }
    if (count < 0) {
      LOG(ERROR, "write(): %s", strerror(errno));
      goto close_dst;
    }
  }
  if (size < 0) {
    LOG(ERROR, "read(): %s", strerror(errno));
    goto close_dst;
  }

  okay = true;

close_dst:
  close(dstfd);
close_src:
  close(srcfd);
exit:
  return okay;
}

static char* basename_unsafe(const char* path) {
  char* p = strrchr(path, '/');
  if (!p)
    return NULL;

  if (*++p == '\0')
    return NULL;

  return p;
}

static char* dirname_unsafe(const char* path) {
  static char buffer[512];

  char* p = strrchr(path, '/');
  if (!p) {
    return NULL;
  }

  size_t size = p - path;
  if (size > sizeof(buffer) - 1) {
    LOG(ERROR, "Could not allocate space: %s", path);
    return NULL;
  }

  memcpy(buffer, path, size);
  buffer[size] = '\0';

  return buffer;
}

static char* join_unsafe(const char* dirname, const char* basename) {
  static char buffer[512];

  size_t dirname_size = strlen(dirname);
  size_t basename_size = strlen(basename);
  if (dirname_size + basename_size > sizeof(buffer) - 2) {
    LOG(ERROR, "Could not allocate space: %s/%s", dirname, basename);
    return NULL;
  }

  snprintf(buffer, sizeof(buffer), "%s/%s", dirname, basename);
  return buffer;
}

static bool exist(const char* path) {
  struct stat buf;

  if (stat(path, &buf)) {
    if (errno != ENOENT) {
      LOG(DEBUG, "stat(): %s", strerror(errno));
    }
    return errno != ENOENT;
  }

  return true;
}

static bool isdir(const char* path) {
  struct stat buf;

  if (stat(path, &buf)) {
    if (errno != ENOENT) {
      LOG(DEBUG, "stat(): %s", strerror(errno));
    }
    return false;
  }

  return S_ISDIR(buf.st_mode);
}
