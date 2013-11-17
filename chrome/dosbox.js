// Copyright (C) 2013 Che-Liang Chiou.


function Module() {
  var self = this;

  var container = null;
  var module = null;

  function load() {
    container = $('#nacl-module-container')[0];
    container.addEventListener('load', onLoad, true);
    container.addEventListener('message', onMessage, true);
    $('<embed/>', {attr: {
      id: 'nacl-module',
      src: 'dosbox.nmf',
      type: 'application/x-nacl',
    }}).addClass('nacl-module').appendTo(container);
  }
  self.load = load;

  function unload() {
    container.removeEventListener('load', onLoad, true);
    container.removeEventListener('message', onMessage, true);
    $('#nacl-module').remove();
    container = null;
    module = null;
    if (self.onUnload) {
      self.onUnload();
    }
  }
  self.unload = unload;

  function postMessage(message) {
    module.postMessage(message);
  }
  self.postMessage = postMessage;

  function onLoad() {
    $('#nacl-module').focus();
    module = $('#nacl-module')[0];
  }

  function onMessage(message) {
    if (typeof message.data !== 'string') {
      console.log('Message is not a string: message=' + message);
      return;
    }
    console.log('message=' + message.data);
    message = JSON.parse(message.data);
    if (message.type === 'sys') {
      if (message.action === 'quit') {
        unload();
        return;
      } else if (message.action === 'log') {
        showStatus(message.level.toUpperCase() + ': ' + message.message);
        return;
      }
    }
  }

  return self;
}


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


function dirForEach(getDirectory, onEntry, onError) {
  function onDirectory(dirEntry) {
    var dirReader = dirEntry.createReader();

    function readEntries() {
      dirReader.readEntries(function (results) {
        if (results.length) {
          for (var i = 0; i < results.length; i++) {
            onEntry(results[i]);
          }
          readEntries();
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
  }, logError);
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


function exit() {
  showStatus('Exit');
  chrome.app.window.current().close();
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
    showStatus('Copying...');
    copyDirectory(getLocalDirectory, getHtml5Directory, true,
      onSuccess, logError);
  });

  $('#export').click(function () {
    showStatus('Exporting...');
    copyDirectory(getHtml5Directory, getLocalDirectory, false,
      onSuccess, logError);
  });

  $('#remove').click(function () {
    showStatus('Removing...');
    dirForEach(getHtml5Directory, remove);
  });

  $('#show').click(function () {
    $('#show').hide('slow');
    $('#toolbar').show('slow');
  });

  $('#show').hide();

  $('#hide').click(function () {
    $('#show').show('slow');
    $('#toolbar').slideUp('slow');
  });

  var module = new Module();
  module.onUnload = exit;
  module.load();
}


$(document).ready(main);
