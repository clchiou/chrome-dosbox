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
  // TODO(clchiou): Let pepper.cpp and here read this path from a config file?
  var cDrivePath = '/c_drive';

  var getHtml5Directory = makeGetHtml5Directory(makeRequestHtml5FileSystem(),
      cDrivePath);

  function onSuccess() {
    showStatus('Success');
  }

  $('#copy').click(function () {
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

  $('#remove').click(function () {
    showStatus('Clearing...');
    dirForEach(getHtml5Directory, remove, onSuccess, logError);
  });
}


$(document).ready(main);
