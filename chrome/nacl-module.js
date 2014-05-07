// Copyright (C) 2014 Che-Liang Chiou.


/*global document, jQuery, Log */

var NaClModule = (function ($, Log) {
  'use strict';
  var Module;

  Module = function (containerId, moduleId) {
    if (!(this instanceof Module)) {
      return new Module(containerId, moduleId);
    }
    this.containerId = containerId;
    this.moduleId = moduleId;
  };

  Module.prototype.container = function () {
    var container;
    container = $(this.containerId)[0];
    if (!container) {
      Log.d('Could not find container!');
    }
    return container;
  };

  Module.prototype.module = function () {
    // XXX: Why sometimes jQuery couldn't find the element?
    var module;
    module = $(this.moduleId)[0] || document.getElementById(this.moduleId);
    if (!module) {
      Log.d('Could not find module!');
    }
    return module;
  };

  Module.prototype.load = function (nmf) {
    var container, module;
    container = this.container();
    if (this.onLoad) {
      this.onLoad_bind = this.onLoad.bind(this);
      container.addEventListener('load', this.onLoad_bind, true);
    }
    if (this.onMessage) {
      this.onMessage_bind = this.onMessage.bind(this);
      container.addEventListener('message', this.onMessage_bind, true);
    }
    module = $('<embed/>', {attr: {
      id: this.moduleId,
      src: nmf,
      type: 'application/x-nacl'
    }});
    module.appendTo(container);
    return module;
  };

  Module.prototype.unload = function () {
    var container;
    container = this.container();
    if (this.onLoad) {
      container.removeEventListener('load', this.onLoad_bind, true);
    }
    if (this.onMessage) {
      container.removeEventListener('message', this.onMessage_bind, true);
    }
    $(this.moduleId).remove();
    if (this.onUnload) {
      this.onUnload();
    }
  };

  Module.prototype.size = function () {
    var module = $(this.moduleId);
    return {width: module.width(), height: module.height()};
  };

  Module.prototype.css = function (css) {
    $(this.moduleId).css(css);
  };

  Module.prototype.postMessage = function (message) {
    Log.d('Module.postMessage: message=' + message);
    this.module().postMessage(message);
  };

  return {
    Module: Module,
  };
}(jQuery, Log));
