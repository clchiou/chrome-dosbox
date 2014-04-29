// Copyright (C) 2014 Che-Liang Chiou.


/*global chrome, document, jQuery, Filer, Log, Import, Export */

(function ($, Filer, Log, Import, Export) {
  'use strict';
  var Config, main, afterFilerInitialized, onError,
    filer, quota, cDrivePath, cDriveMountPath;

  // TODO(clchiou): Let pepper.cpp and here read these data from a config file?
  cDrivePath = '/c_drive';
  cDriveMountPath = '/data/c_drive';
  quota = 1024 * 1024 * 1024;  // 1 GB

  main = function () {
    Log.d('Initializing file system');
    filer = new Filer();
    filer.init({persistent: true, size: quota},
      afterFilerInitialized, onError);
  };

  afterFilerInitialized = function () {
    var exportWidget, config;
    Log.d('Initializing UI');

    $('#accordion').accordion({heightStyle: 'content'});

    $('#do-import').click(function () {
      Import.importDirectory(filer, cDrivePath, function () {
        Log.i('Succeed in importing files; please restart DOSBox');
      }, onError);
    });

    $('#do-export').click(function () {
      Export.exportDirectory(filer, cDrivePath, function () {
        Log.i('Succeed in exporting C Drive');
      }, onError);
    });

    exportWidget = new Export.Widget('export-files');
    exportWidget.loadExportPaths(chrome.storage.sync);
    $('#do-save-export-files-list').button().click(function () {
      exportWidget.saveExportPaths(chrome.storage.sync);
    });
    $('#do-export-files').button().click(function () {
      var dosPaths = exportWidget.getDosPaths();
      Export.exportFiles(filer, cDrivePath, dosPaths);
    });
    Export.getFilePaths(filer, cDrivePath, function (html5fsPath) {
      var dosPath = Export.toDosPath(cDrivePath, html5fsPath);
      exportWidget.pushAutocompletePath(dosPath);
    });

    $('#do-remove').button().click(function () {
      Log.d('Clearing C Drive contents');
      filer.rm(cDrivePath, function () {
        Log.i('Succeed in clearing C Drive contents');
      }, onError);
    });

    // Load stored values.
    config = new Config(chrome.storage.sync);
    config.get(function (args) {
      $('#args-value')[0].value = args;
    }, function (config) {
      $('#config-value')[0].value = config;
    });
    // Bind for args.
    $('#args-set').button().click(function () {
      config.setArgs($('#args-value')[0].value);
    });
    $('#args-reset').button().click(function () {
      $('#args-value')[0].value = config.defaultArgs;
      config.setArgs(config.defaultArgs);
    });
    // Bind for config.
    $('#config-set').button().click(function () {
      config.setConfig($('#config-value')[0].value);
    });
    $('#config-reset').button().click(function () {
      $('#config-value')[0].value = config.defaultConfig;
      config.setConfig(config.defaultConfig);
    });
  };

  Config = function (storage) {
    if (!(this instanceof Config)) {
      return new Config(storage);
    }
    this.storage = storage;
  };

  // Keys.
  Config.prototype.args = 'dosbox-args';
  Config.prototype.config = 'dosbox-config';

  // Default values.
  Config.prototype.defaultArgs = 'dosbox ' + cDriveMountPath;
  Config.prototype.defaultConfig =
    '# DOSBox configuration file\n' +
    '[sdl]\n' +
    'output=opengl\n';

  Config.prototype.get = function (onArgs, onConfig) {
    var getter, query;
    getter = function (items) {
      if (!items[this.args]) {
        Log.w('Config.get: Could not load args: '
            + chrome.runtime.lastError);
      } else {
        onArgs(items[this.args]);
      }
      if (!items[this.config]) {
        Log.w('Config.get: Could not load config: '
            + chrome.runtime.lastError);
      } else {
        onConfig(items[this.config]);
      }
    };
    query = {};
    query[this.args] = this.defaultArgs;
    query[this.config] = this.defaultConfig;
    this.storage.get(query, getter.bind(this));
  };

  Config.prototype.setArgs = function (newArgs) {
    var query = {};
    query[this.args] = newArgs;
    this.storage.set(query);
  };

  Config.prototype.setConfig = function (newConfig) {
    var query = {};
    query[this.config] = newConfig;
    this.storage.set(query);
  };

  onError = function (error) {
    if (error.name === 'EntryUndefined') {
      Log.e('Could not open target (did you open a symlink?)');
    } else if (error.name === 'InvalidModificationError') {
      Log.e('Could not override target.');
    } else {
      Log.e('Error: ' + error.name);
    }
  };

  $(document).ready(main);
}(jQuery, Filer, Log, Import, Export));
