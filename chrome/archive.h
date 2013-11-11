// Copyright (C) 2013 Che-Liang Chiou.

#ifndef ARCHIVE_H_
#define ARCHIVE_H_


#include <string>

bool Archive(const std::string& archive, const std::string& rootpath,
    const std::string& srcdir);

bool Extract(const std::string& archive, const std::string& rootpath);


#endif // ARCHIVE_H_
