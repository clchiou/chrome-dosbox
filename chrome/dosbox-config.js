// Copyright (C) 2014 Che-Liang Chiou.


var DOSBoxConfig = (function (Blob, FileReader, Log) {
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
    defaultArgs: 'dosbox /data/c_drive',

    keyConfigStorageType: 'dosbox-config-storage-type',
    defaultConfigStorageType: 'chrome-storage',

    typeChromeStorage: 'chrome-storage',
    typeGoogleDrive: 'google-drive',

    keyConfig: 'dosbox-config',
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

    configStorageType: function (value) {
      var query = {};
      if (typeof value === 'function') {
        query[this.keyConfigStorageType] = this.defaultConfigStorageType;
        chrome.storage.sync.get(query,
            get.bind(null, this.keyConfigStorageType, value));
      } else {
        query[this.keyConfigStorageType] = value;
        chrome.storage.sync.set(query);
      }
    },

    config: function (value) {
      var onConfigStorageType = function (type) {
        Log.d('onConfigStorageType: type=' + type);
        if (type === this.typeChromeStorage) {
          this.configChromeStorage(value);
        } else if (type === this.typeGoogleDrive) {
          this.configGoogleDrive(value);
        } else {
          Log.e('Could not store config file');
        }
      };
      this.configStorageType(onConfigStorageType.bind(this));
    },

    configChromeStorage: function (value) {
      var query = {};
      if (typeof value === 'function') {
        query[this.keyConfig] = this.defaultConfig;
        chrome.storage.sync.get(query, get.bind(null, this.keyConfig, value));
      } else {
        query[this.keyConfig] = value;
        chrome.storage.sync.set(query);
      }
    },

    configGoogleDrive: function (value) {
      chrome.syncFileSystem.requestFileSystem(function (fs) {
        var path, onEntry, onError;

        path = 'dosbox-chrome.conf';

        onEntry = function (entry) {
          if (typeof value === 'function') {
            entry.file(function (file) {
              var reader = new FileReader();
              reader.onloadend = function () {
                value(this.result);
              };
              reader.readAsText(file);
            }, onError);
          } else {
            entry.createWriter(function (writer) {
              writer.onwriteend = function () {
                Log.d('configGoogleDrive: onwriteend: succeed!');
              };
              writer.onerror = onError;
              writer.write(new Blob([value]));
            }, onError);
          }
        };

        onError = function (error) {
          Log.d('configGoogleDrive: onError: error=' + error);
          Log.e('Could not access config file: ' + error);
        };

        fs.root.getFile(path, {create: true}, onEntry.bind(this), onError);
      }.bind(this));
    },

    fill: function (keys, value) {
      var i, items = {};
      for (i = 0; i < keys.length; i++) {
        items[keys[i]] = value;
      }
      return items;
    },
  };
}(Blob, FileReader, Log));
