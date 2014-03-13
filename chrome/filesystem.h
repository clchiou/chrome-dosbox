// Copyright (C) 2013 Che-Liang Chiou.

#ifndef FILESYSTEM_H_
#define FILESYSTEM_H_

// It is unfortunate that we cannot use boost::filesystem.

bool MakeDirectory(const char* path);

bool CopyDirectory(const char* src, const char* parent);

#endif  // FILESYSTEM_H_
