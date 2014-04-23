// Copyright (C) 2014 Che-Liang Chiou.

function Exporter(exportFilesElementId, cDrivePath) {
  var self = this;

  var exportFilesKey = 'export-files';

  var exportFilesElement = $(exportFilesElementId);
  var numInputBoxes = 0;
  var inputBoxContents = [];
  var autocompleteList = [];

  function onExportFiles() {
    console.log('inputBoxContents=' + inputBoxContents);
    var exportFiles = [];
    for (var i in inputBoxContents) {
      var str = inputBoxContents[i].trim();
      if (str) {
        var path = toHtml5fsPath(cDrivePath, str);
        if (path.substring(cDrivePath.length).search(/[^\/]/) === -1) {
          continue;
        }
        console.log('Export path: ' + path);
        exportFiles.push(path);
      }
    }
    // Save export files for the next time.
    var items = {};
    items[exportFilesKey] = exportFiles;
    chrome.storage.sync.set(items);
    // Now, export files.
    doExportFiles(exportFiles);
  }
  self.onExportFiles = onExportFiles;

  function doExportFiles(exportFiles) {
    getLocalDirectory(function (dstEntry) {
      for (var i in exportFiles) {
        openFileOrDirectory(exportFiles[i], function (srcEntry) {
          TheFiler.cp(srcEntry, dstEntry, null, function (newEntry) {
            console.log('Copy ' + exportFiles[i] + ' to ' + newEntry.fullPath);
          }, fsOnError);
        }, fsOnError);
      }
    }, fsOnError);
  }

  function onInputBoxKeyup(e) {
    var inputBox = $(this);
    var val = inputBox.val();
    if (val.toUpperCase() === 'C:' || val.toUpperCase() === 'C:\\') {
      inputBox.css('color', '#979797');
    } else {
      inputBox.css('color', '#000000');
    }
    if (e.keyCode == 13) {
      addInputBox().focus();
      return;
    }
    var i = inputBox.attr('name');
    inputBoxContents[i] = val;
  }

  function addInputBox(dosPath) {
    // XXX: We exploit the fact that autocomplete() does not make a copy of
    // source array.
    var inputBox = $('<input>', {type: 'text', name: numInputBoxes})
      .addClass('export-files-item')
      .keyup(onInputBoxKeyup)
      .autocomplete({source: autocompleteList});
    if (dosPath) {
      inputBox.val(dosPath);
      inputBoxContents.push(dosPath);
    } else {
      inputBox.val('C:\\').css('color', '#979797');
      inputBoxContents.push('');
    }
    numInputBoxes++;
    exportFilesElement.append($('<li>').append(inputBox));
    return inputBox;
  }

  function loadTree(path) {
    traverse(path, function (entry) {
      autocompleteList.push(toDosPath(cDrivePath, entry.fullPath));
    }, function (error) {
      console.log('loadTree: Fail: ' + error.name);
    });
  }

  // Load autocomplete list.
  loadTree(cDrivePath);

  // Load export files of last time.
  chrome.storage.sync.get(exportFilesKey, function (items) {
    var exportFiles = items[exportFilesKey];
    if (exportFiles) {
      for (i in exportFiles) {
        var dosPath = toDosPath(cDrivePath, exportFiles[i]);
        addInputBox(dosPath);
      }
    }
    // Create an empty input box at last.
    addInputBox().focus();
  });

  return self;
}


/*global jQuery, Log */

var Export;

Export = (function ($, Log) {
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

  Widget.prototype.pushAutocompletePath = function (dosPath) {
    this.autocompletePaths.push(dosPath);
  };

  Widget.prototype.getItemClassName = function () {
    return this.elementId + '-item';
  };

  Widget.prototype.addInputBox = function (dosPath) {
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
    var paths;
    paths = [];
    $('.' + this.getItemClassName()).each(function (i, input) {
      unused(i);
      paths.push($(input).val());
    });
    return paths;
  };

  Export = {
    Widget: Widget,

    config: {
      colorLight: '#979797',
      colorDark: '#000000',
    },

    loadFilePaths: function (filer, cDrivePath, pushPath) {
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
        Log.e('loadFilePaths: Could not load paths: ' + error.name);
      };

      filer.ls(cDrivePath, onEntries, onError);
    },

    getExportFilepaths: function (cDrivePath, filepaths) {
      var i, filepath, exportFilepaths;
      exportFilepaths = [];
      for (i = 0; i < filepaths.length; i++) {
        filepath = filepaths[i].trim();
        if (filepath !== '') {
          filepath = this.toHtml5fsPath(cDrivePath, filepath);
          if (filepath !== cDrivePath) {
            exportFilepaths.push(filepath);
          }
        }
      }
      return exportFilepaths;
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
}(jQuery, Log));

// TODO(clchiou): For backward compatibility; remove soon.
toDosPath = Export.toDosPath;
toHtml5fsPath = Export.toHtml5fsPath;
