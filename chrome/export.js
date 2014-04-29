// Copyright (C) 2014 Che-Liang Chiou.


/*global chrome, jQuery, Log, FsUtil */

var Export = (function ($, Log, FsUtil) {
  'use strict';

  var Widget, Export, unused;

  unused = function () {
    return 0;
  };

  Widget = function (elementId) {
    if (!(this instanceof Widget)) {
      return new Widget(elementId);
    }
    this.elementId = elementId;
    this.autocompletePaths = [];
  };

  Widget.prototype.loadExportPaths = function (storage) {
    var getter;

    getter = function (items) {
      var i, dosPaths;
      if (!items[Export.config.exportDosPaths]) {
        Log.w('loadExportPaths: Could not load export paths from storage: ' +
          chrome.runtime.lastError);
        this.addInputBox();
        return;
      }
      dosPaths = items[Export.config.exportDosPaths];
      for (i = 0; i < dosPaths.length; i++) {
        this.addInputBox(dosPaths[i]);
      }
      this.addInputBox();
    };

    storage.get(Export.config.exportDosPaths, getter.bind(this));
  };

  Widget.prototype.saveExportPaths = function (storage) {
    var items = {};
    items[Export.config.exportDosPaths] = this.getDosPaths();
    storage.set(items, function () {
      if (chrome.runtime.lastError) {
        Log.w('loadExportPaths: Could not save export paths to storage: ' +
          chrome.runtime.lastError);
      }
    });
  };

  Widget.prototype.pushAutocompletePath = function (dosPath) {
    this.autocompletePaths.push(dosPath);
  };

  Widget.prototype.getItemClassName = function () {
    return this.elementId + '-item';
  };

  Widget.prototype.addInputBox = function (dosPath) {
    Log.d('addInputBox: dosPath=' + dosPath);
    var input, color;
    if (dosPath) {
      color = Export.config.colorDark;
    } else {
      dosPath = 'C:\\';
      color = Export.config.colorLight;
    }
    input = $('<input>', {type: 'text'})
      .addClass(this.getItemClassName())
      .val(dosPath)
      .css('color', color)
      .autocomplete({source: this.autocompletePaths});
    input.keyup(this.onKeyup.bind(this, input));
    $('#' + this.elementId).append($('<li>').append(input));
    return input;
  };

  Widget.prototype.onKeyup = function (input, e) {
    var val = input.val().toUpperCase();
    if (val === 'C:' || val === 'C:\\') {
      input.css('color', Export.config.colorLight);
    } else {
      input.css('color', Export.config.colorDark);
    }
    if (e.keyCode === 13) {
      this.addInputBox().focus();
    }
  };

  Widget.prototype.getDosPaths = function () {
    var rawDosPaths, dosPaths, dosPath, i;
    rawDosPaths = [];
    $('.' + this.getItemClassName()).each(function (i, input) {
      unused(i);
      rawDosPaths.push($(input).val());
    });
    dosPaths = [];
    for (i = 0; i < rawDosPaths.length; i++) {
      dosPath = rawDosPaths[i].trim();
      if (dosPath.toUpperCase() !== 'C:' && dosPath.toUpperCase() !== 'C:\\') {
        dosPaths.push(dosPath);
      }
    }
    return dosPaths;
  };

  Export = {
    Widget: Widget,

    config: {
      colorLight: '#979797',
      colorDark: '#000000',
      exportDosPaths: 'export-dos-paths',
    },

    exportDirectory: function (filer, path, onSuccess, onError) {
      Log.d('Selecting export destination');
      FsUtil.getLocalDirectory(function (dstDir) {
        filer.fs.root.getDirectory(path, {create: true}, function (srcEntry) {
          Log.i('Copying files');
          FsUtil.copy(filer, srcEntry, dstDir, onSuccess, onError);
        }, onError);
      }, onError);
    },

    getFilePaths: function (filer, cDrivePath, pushPath) {
      var onEntries, onError;

      onEntries = function (entries) {
        var i;
        for (i = 0; i < entries.length; i++) {
          pushPath(entries[i].fullPath);
        }
        for (i = 0; i < entries.length; i++) {
          if (entries[i].isDirectory) {
            filer.ls(entries[i].fullPath, onEntries, onError);
          }
        }
      };

      onError = function (error) {
        Log.e('getFilePaths: Could not load paths: ' + error.name);
      };

      filer.ls(cDrivePath, onEntries, onError);
    },

    exportFiles: function (filer, cDrivePath, dosPaths) {
      var html5fsPaths = this.getExportFilePaths(cDrivePath, dosPaths);
      FsUtil.getLocalDirectory(function (dstEntry) {
        var i, onSrcEntry, onSuccess, onError;

        onSrcEntry = function (srcEntry) {
          FsUtil.copy(filer, srcEntry, dstEntry, onSuccess, onError);
        };

        onSuccess = function (newEntry) {
          Log.d('Succeed in copying:' +
            ' src=' + html5fsPaths[i] +
            ' dst=' + newEntry.fullPath);
          i++;
          if (i < html5fsPaths.length) {
            FsUtil.openFileOrDirectory(filer.fs, html5fsPaths[i],
              onSrcEntry, onError);
          } else {
            Log.i('Succeed in exporting files');
          }
        };

        onError = function (error) {
          var dosPath = Export.toDosPath(cDrivePath, html5fsPaths[i]);
          Log.e('Could not copy "' + dosPath + '": ' + error.name);
        };

        i = 0;
        FsUtil.openFileOrDirectory(filer.fs, html5fsPaths[i],
            onSrcEntry, onError);
      });
    },

    getExportFilePaths: function (cDrivePath, dosPaths) {
      var i, filePath, exportFilePaths;
      exportFilePaths = [];
      for (i = 0; i < dosPaths.length; i++) {
        filePath = dosPaths[i].trim();
        if (filePath !== '') {
          filePath = this.toHtml5fsPath(cDrivePath, filePath);
          if (filePath !== cDrivePath) {
            exportFilePaths.push(filePath);
          }
        }
      }
      return exportFilePaths;
    },

    toDosPath: function (cDrivePath, html5fsPath) {
      var dosPath = html5fsPath;
      if (html5fsPath.substring(0, cDrivePath.length) === cDrivePath) {
        dosPath = html5fsPath.substring(cDrivePath.length);
      }
      dosPath = dosPath.replace(/\/+/g, '\\').replace(/\\$/g, '');
      if (dosPath[0] !== '\\') {
        dosPath = '\\' + dosPath;
      }
      return 'C:' + dosPath;
    },

    toHtml5fsPath: function (cDrivePath, dosPath) {
      var html5fsPath = dosPath;
      if (dosPath.substring(0, 2).toUpperCase() === 'C:') {
        html5fsPath = dosPath.substring(2);
      }
      html5fsPath = html5fsPath.replace(/\\+/g, '/').replace(/\/$/g, '');
      if (html5fsPath !== '' && html5fsPath[0] !== '/') {
        html5fsPath = '/' + html5fsPath;
      } else if (html5fsPath === '/') {
        html5fsPath = '';
      }
      return cDrivePath + html5fsPath;
    },
  };

  return Export;
}(jQuery, Log, FsUtil));
