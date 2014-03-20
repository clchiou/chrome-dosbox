// Copyright (C) 2014 Che-Liang Chiou.


function Exporter(exportFilesId, cDrivePath) {
  var self = this;

  var exportFiles = $(exportFilesId);
  var inputBoxIndex = -1;
  var inputBoxContents = [];
  var autocompleteList = [];

  function doExport() {
    console.log('inputBoxContents=' + inputBoxContents);
    for (var i in inputBoxContents) {
      var str = inputBoxContents[i].trim();
      if (str) {
        var path = toHtml5fsPath(cDrivePath, str);
        if (path.substring(cDrivePath.length).search(/[^\/]/) === -1) {
          continue;
        }
        console.log('Export path: ' + path);
      }
    }
  }
  self.doExport = doExport;

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

  function addInputBox() {
    // XXX: We exploit the fact that autocomplete() does not make a copy of
    // source array.
    var inputBox = $('<input>', {type: 'text', name: ++inputBoxIndex})
      .addClass('export-files-item')
      .keyup(onInputBoxKeyup)
      .autocomplete({source: autocompleteList})
      .val('C:\\')
      .css('color', '#979797');
    inputBoxContents.push('');
    exportFiles.append($('<li>').append(inputBox));
    return inputBox;
  }

  function loadTree(path) {
    var getDirectory = makeGetHtml5Directory(makeRequestHtml5FileSystem(), path);
    traverse(true, getDirectory, function (entry) {
      autocompleteList.push(toDosPath(cDrivePath, entry.fullPath));
    }, function () {
      // Do nothing on success.
    }, function (error) {
      console.log('loadTree: Fail: ' + error.name);
    });
  }

  // Load autocomplete list.
  loadTree(cDrivePath);

  // Create the default empty input box.
  addInputBox();

  return self;
}


function toDosPath(cDrivePath, html5fsPath) {
  var dosPath = html5fsPath;
  if (html5fsPath.substring(0, cDrivePath.length) === cDrivePath) {
    dosPath = html5fsPath.substring(cDrivePath.length);
  }
  dosPath = dosPath.replace(/\//g, '\\');
  if (dosPath[0] !== '\\') {
    dosPath = '\\' + dosPath;
  }
  return 'C:' + dosPath;
}


function toHtml5fsPath(cDrivePath, dosPath) {
  var html5fsPath = dosPath;
  if (dosPath.substring(0, 2).toUpperCase() === 'C:') {
    html5fsPath = dosPath.substring(2);
  }
  html5fsPath = html5fsPath.replace(/\\/g, '/');
  if (html5fsPath !== '' && html5fsPath[0] !== '/') {
    html5fsPath = '/' + html5fsPath;
  } else if (html5fsPath === '/') {
    html5fsPath = '';
  }
  return cDrivePath + html5fsPath;
}
