// Copyright (C) 2014 Che-Liang Chiou.


/*global chrome, Log */

var DOSBoxConfig = (function (Log) {
  'use strict';
  var get;

  get = function (key, onValue, items) {
    if (chrome.runtime.lastError) {
      Log.w('DOSBoxConfig.get: ' + key + ' error=' + chrome.runtime.lastError);
    }
    onValue(items[key]);
  };

  return {
    keyShowHint: 'show-hints-dialog',

    keyArgs: 'dosbox-args',
    keyConfig: 'dosbox-config',

    defaultArgs: 'dosbox /data/c_drive',
    defaultConfig:
      '# DOSBox configuration file\n' +
      '[sdl]\n' +
      'output=opengl\n',

    args: function (value) {
      var query = {};
      if (typeof value === 'function') {
        query[this.keyArgs] = this.defaultArgs;
        chrome.storage.sync.get(query, get.bind(null, this.keyArgs, value));
      } else {
        query[this.keyArgs] = value;
        chrome.storage.sync.set(query);
      }
    },

    config: function (value) {
      var query = {};
      if (typeof value === 'function') {
        query[this.keyConfig] = this.defaultConfig;
        chrome.storage.sync.get(query, get.bind(null, this.keyConfig, value));
      } else {
        query[this.keyConfig] = value;
        chrome.storage.sync.set(query);
      }
    },

    fill: function (keys, value) {
      var i, items = {};
      for (i = 0; i < keys.length; i++) {
        items[keys[i]] = value;
      }
      return items;
    },
  };
}(Log));
