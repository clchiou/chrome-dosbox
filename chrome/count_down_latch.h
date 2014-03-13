// Copyright (C) 2014 Che-Liang Chiou.

#ifndef COUNT_DOWN_LATCH_H_
#define COUNT_DOWN_LATCH_H_

#include <pthread.h>

class CountDownLatch {
 public:
  explicit CountDownLatch(int count);
  ~CountDownLatch();

  void Await();
  void CountDown();

 private:
  pthread_mutex_t lock_;
  pthread_cond_t is_zero_;
  int count_;
};

#endif  // COUNT_DOWN_LATCH_H_
