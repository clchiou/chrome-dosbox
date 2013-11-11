// Copyright (C) 2013 Che-Liang Chiou.

#include "archive.h"

#include <errno.h>
#include <fcntl.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>

#include <libtar.h>
#include <zlib.h>

#include "log.h"


static int GzipOpen(char* path, int oflags, int mode);

static tartype_t GzipType = {
  (openfunc_t) GzipOpen,
  (closefunc_t) gzclose,
  (readfunc_t) gzread,
  (writefunc_t) gzwrite
};


bool Archive(const std::string& archive, const std::string& rootpath,
    const std::string& srcdir) {
  TAR *tar;

  if (tar_open(&tar, const_cast<char*>(archive.c_str()), &GzipType,
        O_WRONLY | O_CREAT, 0644, TAR_VERBOSE | TAR_GNU)) {
    LOG(ERROR, "Could not open archive: %s", strerror(errno));
    return false;
  }

  bool okay = false;

  std::string srcpath = rootpath + "/" + srcdir;
  if (tar_append_tree(tar, const_cast<char*>(srcpath.c_str()),
        const_cast<char*>(srcdir.c_str()))) {
    LOG(ERROR, "Could not append %s to archive: %s", srcpath.c_str(),
        strerror(errno));
    goto close_archive;
  }

  if (tar_append_eof(tar)) {
    LOG(ERROR, "Could not append EOF to archive: %s", strerror(errno));
    goto close_archive;
  }

  okay = true;

close_archive:
  if (tar_close(tar)) {
    LOG(ERROR, "Could not close archive: %s", strerror(errno));
    okay = false;
  }

  return okay;
}


bool Extract(const std::string& archive, const std::string& rootpath) {
  TAR *tar;

  if (tar_open(&tar, const_cast<char*>(archive.c_str()), &GzipType,
        O_RDONLY, 0, TAR_VERBOSE | TAR_GNU)) {
    LOG(ERROR, "Could not open archive: %s", strerror(errno));
    return false;
  }

  bool okay = false;

  if (tar_extract_all(tar, const_cast<char*>(rootpath.c_str()))) {
    LOG(ERROR, "Could not extract archive: %s", strerror(errno));
    goto close_archive;
  }

  okay = true;

close_archive:
  if (tar_close(tar)) {
    LOG(ERROR, "Could not close archive: %s", strerror(errno));
    okay = false;
  }

  return okay;
}


static int GzipOpen(char* path, int oflags, int mode) {
  gzFile gzf;

  char gzoflags[3];
  switch (oflags & O_ACCMODE) {
    case O_WRONLY:
      strcpy(gzoflags, "wb");
      break;
    case O_RDONLY:
      strcpy(gzoflags, "rb");
      break;
    default:
    case O_RDWR:
      errno = EINVAL;
      return -1;
  }

  int fd = open(path, oflags, mode);
  if (fd < 0)
    return -1;

  if ((oflags & O_CREAT) && fchmod(fd, mode))
    return -1;

  gzf = gzdopen(fd, gzoflags);
  if (!gzf) {
    errno = ENOMEM;
    return -1;
  }

  return (int)gzf;
}
