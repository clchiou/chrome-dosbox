// Copyright (C) 2013 Che-Liang Chiou.

#ifndef LOCK_H_
#define LOCK_H_

class Lock {
 public:
  explicit Lock(pthread_mutex_t* lock) : lock_(lock) {
    pthread_mutex_lock(lock_);
  }

  ~Lock() { pthread_mutex_unlock(lock_); }

 private:
  pthread_mutex_t* lock_;
};

#endif  // LOCK_H_
