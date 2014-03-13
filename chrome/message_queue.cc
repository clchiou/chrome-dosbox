// Copyright (C) 2013 Che-Liang Chiou.

#include "message_queue.h"

#include <sstream>
#include <string>

#include "lock.h"

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

MessageQueue::MessageQueue() {
  pthread_mutex_init(&lock_, NULL);
  pthread_cond_init(&is_not_empty_, NULL);
}

MessageQueue::~MessageQueue() {
  pthread_mutex_destroy(&lock_);
  pthread_cond_destroy(&is_not_empty_);
}

void MessageQueue::Add(const Message& message) {
  Lock lock(&lock_);
  queue_.push_front(message);
  pthread_cond_signal(&is_not_empty_);
}

void MessageQueue::Pop(Message* message) {
  Lock lock(&lock_);
  while (queue_.empty())
    pthread_cond_wait(&is_not_empty_, &lock_);
  *message = queue_.back();
  queue_.pop_back();
}
