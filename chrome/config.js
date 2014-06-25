// Copyright (C) 2014 Che-Liang Chiou.


/*global chrome, document, jQuery, Filer, Log, Import, Export, DOSBoxConfig */

(function ($, Filer, Log, Import, Export, DOSBoxConfig) {
  'use strict';
  var main, afterFilerInitialized, onError, filer, quota, cDrivePath;

  // TODO(clchiou): Let pepper.cpp and here read these data from a config file?
  cDrivePath = '/c_drive';
  quota = 1024 * 1024 * 1024;  // 1 GB

  main = function () {
    var items;

    Log.d('Initializing file system');
    filer = new Filer();
    filer.init({persistent: true, size: quota},
      afterFilerInitialized, onError);

    // Show hints at startup.
    items = DOSBoxConfig.fill([DOSBoxConfig.keyShowHint], true);
    chrome.storage.local.get(items, function (items) {
      $('#show-hints').prop('checked', items[DOSBoxConfig.keyShowHint]);
    });
    $('#show-hints').change(function () {
      chrome.storage.local.set(DOSBoxConfig.fill([DOSBoxConfig.keyShowHint],
          $(this).prop('checked')));
    });
  };

  afterFilerInitialized = function () {
    var exportWidget;
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
    DOSBoxConfig.args(function (args) {
      $('#args-value')[0].value = args;
    });
    DOSBoxConfig.config(function (config) {
      $('#config-value')[0].value = config;
    });
    // Bind for args.
    $('#args-set').button().click(function () {
      Log.d('Save command-line arguments');
      DOSBoxConfig.args($('#args-value')[0].value);
    });
    $('#args-reset').button().click(function () {
      Log.d('Restore command-line arguments');
      $('#args-value')[0].value = DOSBoxConfig.defaultArgs;
      DOSBoxConfig.args(DOSBoxConfig.defaultArgs);
    });
    // Bind for config.
    $('#config-set').button().click(function () {
      var contents = $('#config-value')[0].value;
      Log.d('Save config file');
      DOSBoxConfig.configStorageType(function (type) {
        if (type !== DOSBoxConfig.typeChromeStorage) {
          return;
        }
        if (contents.length < 4096) {
          return;
        }
        $('#info').dialog().text(
          'Config file exceeds internal storage size limit. ' +
            'Please use Google Drive (check the box on the right).'
        );
      });
      DOSBoxConfig.config(contents);
    });
    $('#config-reset').button().click(function () {
      Log.d('Restore config file');
      $('#config-value')[0].value = DOSBoxConfig.defaultConfig;
      DOSBoxConfig.config(DOSBoxConfig.defaultConfig);
    });
    // Bind for 'Store to Google Drive'
    DOSBoxConfig.configStorageType(function (type) {
      $('#config-google-drive').prop('checked',
        type === DOSBoxConfig.typeGoogleDrive);
    });
    $('#config-google-drive').change(function () {
      var type = DOSBoxConfig.defaultConfigStorageType;
      if ($(this).prop('checked')) {
        type = DOSBoxConfig.typeGoogleDrive;
      }
      DOSBoxConfig.configStorageType(type);
    });
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
}(jQuery, Filer, Log, Import, Export, DOSBoxConfig));
