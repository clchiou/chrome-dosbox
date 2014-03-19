// Copyright (C) 2014 Che-Liang Chiou.


function getLocalDirectory(onDirectory, onError) {
  chrome.fileSystem.chooseEntry({
    type: 'openDirectory',
  }, function (dirEntry) {
    if (!dirEntry) {
      onError({name: 'EntryUndefined'});
      return;
    }
    onDirectory(dirEntry);
  });
}


function makeGetHtml5Directory(requestFileSystem, path) {

  function getHtml5Directory(onDirectory, onError) {

    function onFileSystem(fs) {
      if (path === '/') {
        onDirectory(fs.root);
      } else {
        fs.root.getDirectory(path, {create: true}, onDirectory, onError);
      }
    }

    requestFileSystem(onFileSystem, onError);
  }

  return getHtml5Directory;
}


function makeRequestHtml5FileSystem() {
  // TODO(clchiou): Pass quota (and other information) to NaCl module
  var quota = 1024 * 1024 * 1024; // 1 GB

  var requestFs = window.requestFileSystem || window.webkitRequestFileSystem;

  return function (onFileSystem, onError) {
    requestFs(window.PERSISTENT, quota, onFileSystem, onError);
  };
}


function copyDirectory(srcGetDir, dstGetDir, override, onSuccess, onError) {
  srcGetDir(function (srcEntry) {
  dstGetDir(function (dstEntry) {

  if (override) {
    // If destination directory is not empty, W3C spec says you cannot write
    // to it; so remove destination before copy.
    dstEntry.getDirectory(srcEntry.name, {create: true},
    function (targetEntry) {
    targetEntry.removeRecursively(function () {

    console.log('Copy ' + srcEntry.fullPath + ' to ' + dstEntry.fullPath);
    srcEntry.copyTo(dstEntry, null, onSuccess, onError);

    }, onError);
    }, onError);
  } else {
    console.log('Copy ' + srcEntry.fullPath + ' to ' + dstEntry.fullPath);
    srcEntry.copyTo(dstEntry, null, onSuccess, onError);
  }

  }, onError);
  }, onError);
}


function dirForEach(getDirectory, onEntry, onSuccess, onError) {
  function onDirectory(dirEntry) {
    var dirReader = dirEntry.createReader();

    function readEntries() {
      dirReader.readEntries(function (results) {
        if (results.length) {
          for (var i = 0; i < results.length; i++) {
            onEntry(results[i]);
          }
          readEntries();
        } else {
          onSuccess();
        }
      });
    }

    readEntries();
  }

  getDirectory(onDirectory, onError);
}


// Useful for debugging
function listDirectory(path) {
  var getDirectory = makeGetHtml5Directory(makeRequestHtml5FileSystem(), path);
  dirForEach(getDirectory, function (entry) {
    console.log(entry.fullPath);
  }, function () {}, logError);
}


function remove(entry) {
  if (entry.isFile) {
    entry.remove(function () {
      console.log('Remove file ' + entry.fullPath);
    }, logError);
  } else {
    entry.removeRecursively(function () {
      console.log('Remove directory ' + entry.fullPath);
    }, logError);
  }
}


function logError(error) {
  if (error.name == 'EntryUndefined') {
    showStatus('Failed. Did you open a symlink?');
  } else if (error.name == 'InvalidModificationError') {
    showStatus('Failed. Could not override target.');
  } else {
    showStatus('Failed.');
  }
  console.log('Error: ' + error.name);
}


function showStatus(message) {
  $('#status').text(message).fadeOut(8000, function() {
    $('#status').text('').show();
  });
}


function main() {
  $('#accordion').accordion({heightStyle: 'content'});

  // TODO(clchiou): Let pepper.cpp and here read this path from a config file?
  var cDrivePath = '/c_drive';
  var cDriveMountPath = '/data/c_drive';

  var getHtml5Directory = makeGetHtml5Directory(makeRequestHtml5FileSystem(),
      cDrivePath);

  function onSuccess() {
    showStatus('Success');
  }

  $('#import').click(function () {
    showStatus('Select import folder...');
    copyDirectory(getLocalDirectory, getHtml5Directory, true,
      function () {
        showStatus('Success. Please Restart DOSBox for new folder.');
      },
      logError);
  });

  $('#export').click(function () {
    showStatus('Select destination...');
    copyDirectory(getHtml5Directory, getLocalDirectory, false,
      onSuccess, logError);
  });

  var exporter = new Exporter('#export-list');
  $('#export-files').button().click(exporter.doExport);

  $('#remove').button().click(function () {
    showStatus('Clearing...');
    dirForEach(getHtml5Directory, remove, onSuccess, logError);
  });

  var argsDefault = 'dosbox ' + cDriveMountPath;
  var configDefault = (
      '# DOSBox configuration file\n' +
      '[sdl]\n' +
      'output=opengl\n');
  chrome.storage.sync.get({
    args: argsDefault,
    config: configDefault,
  }, function (items) {
    $('#args-value')[0].value = items.args;
    $('#config-value')[0].value = items.config;
  });
  $('#args-set').button().click(function () {
    chrome.storage.sync.set({args: $('#args-value')[0].value});
  });
  $('#args-reset').button().click(function () {
    $('#args-value')[0].value = argsDefault;
    chrome.storage.sync.set({args: argsDefault});
  });
  $('#config-set').button().click(function () {
    chrome.storage.sync.set({config: $('#config-value')[0].value});
  });
  $('#config-reset').button().click(function () {
    $('#config-value')[0].value = configDefault;
    chrome.storage.sync.set({config: configDefault});
  });
}


$(document).ready(main);
