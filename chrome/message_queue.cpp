// Copyright (C) 2013 Che-Liang Chiou.

#include "message_queue.h"

#include <sstream>
#include <string>


class AcquireLock {
 public:
  explicit AcquireLock(pthread_mutex_t *lock) : lock_(lock) {
    pthread_mutex_lock(lock_);
  }

  ~AcquireLock() {
    pthread_mutex_unlock(lock_);
  }

 private:
  pthread_mutex_t *lock_;
};


Message StringToMessage(const std::string& json) {
  Message message;
  std::istringstream isstream(json);
  boost::property_tree::read_json(isstream, message);
  return message;
}


std::string MessageToString(const Message& message) {
  std::ostringstream osstream;
  write_json(osstream, message, false);
  return osstream.str();
}


MessageQueue::~MessageQueue() {
  pthread_mutex_destroy(&lock_);
  pthread_cond_destroy(&is_not_empty_);
}


MessageQueue::MessageQueue() {
  pthread_mutex_init(&lock_, NULL);
  pthread_cond_init(&is_not_empty_, NULL);
}


void MessageQueue::add(const Message& message) {
  AcquireLock acquire_lock(&lock_);
  queue_.push_front(message);
  pthread_cond_signal(&is_not_empty_);
}


void MessageQueue::pop(Message* message) {
  AcquireLock acquire_lock(&lock_);
  while (queue_.empty())
    pthread_cond_wait(&is_not_empty_, &lock_);
  *message = queue_.back();
  queue_.pop_back();
}
