// Copyright (C) 2013 Che-Liang Chiou.

#ifndef LOG_H_
#define LOG_H_

#include <stdio.h>

#define DEBUG "DEBUG"
#define INFO "INFO"
#define WARN "WARN"
#define ERROR "ERROR"

#define LOG(level, fmt, args...)    \
  fprintf(stderr,                   \
          "%s:%s:%s:%d: " fmt "\n", \
          level,                    \
          __FILE__,                 \
          __func__,                 \
          __LINE__,                 \
          ##args)

#endif  // LOG_H_
