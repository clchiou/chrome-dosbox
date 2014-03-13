// Copyright (C) 2014 Che-Liang Chiou.

#include "count_down_latch.h"

#include <assert.h>

#include "lock.h"

CountDownLatch::CountDownLatch(int count) : count_(count) {
  assert(count_ >= 0);
  pthread_mutex_init(&lock_, NULL);
  pthread_cond_init(&is_zero_, NULL);
}

CountDownLatch::~CountDownLatch() {
  pthread_mutex_destroy(&lock_);
  pthread_cond_destroy(&is_zero_);
}

void CountDownLatch::Await() {
  Lock lock(&lock_);
  if (!count_) {
    return;
  }
  while (count_ > 0) {
    pthread_cond_wait(&is_zero_, &lock_);
  }
}

void CountDownLatch::CountDown() {
  Lock lock(&lock_);
  if (!count_) {
    return;
  }
  count_--;
  if (!count_) {
    pthread_cond_signal(&is_zero_);
  }
}
