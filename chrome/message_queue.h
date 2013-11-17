// Copyright (C) 2013 Che-Liang Chiou.

#ifndef MESSAGE_QUEUE_H_
#define MESSAGE_QUEUE_H_

#include <deque>

#include <pthread.h>

#include "boost/property_tree/ptree.hpp"
#include "boost/property_tree/json_parser.hpp"


typedef boost::property_tree::ptree Message;

Message StringToMessage(const std::string& json);

std::string MessageToString(const Message& message);


class MessageQueue {
 public:
  MessageQueue();
  ~MessageQueue();

  void add(const Message& message);
  void pop(Message* message);

 private:
  pthread_mutex_t lock_;
  pthread_cond_t is_not_empty_;
  std::deque<Message> queue_;
};


#endif // MESSAGE_QUEUE_H_
