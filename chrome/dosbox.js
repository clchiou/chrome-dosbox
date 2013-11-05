// Copyright (C) 2013 Che-Liang Chiou.


function Module() {
  self = this;

  var container = null;
  var module = null;

  function load() {
    container = $('#nacl-module-container')[0];
    container.addEventListener('load', onLoad, true);
    $('<embed/>', {attr: {
      id: 'nacl-module',
      src: 'dosbox.nmf',
      type: 'application/x-nacl',
      width: 1024,
      height: 768,
    }}).appendTo(container);
  }
  self.load = load;

  function onLoad() {
    module = $('#nacl-module');
    module.focus();
  }

  return self;
}


function importDirectory() {
  // TODO(clchiou): Let pepper.cpp and here read this path from a config file?
  var rootPath = 'c_drive';

  // TODO(clchiou): Pass quota (and other information) to NaCl module
  var quota = 1024 * 1024 * 1024; // 1 GB

  var requestFileSystem = window.requestFileSystem ||
                          window.webkitRequestFileSystem;

  function onError(error) {
    console.log('Error: ' + errorToString(error));
  }

  // TODO(clchiou): Warn use that he should not choose symlink; otherwise
  // Chrome will silently ignore it :(
  chrome.fileSystem.chooseEntry({
    type: 'openDirectory',
  }, function (srcEntry) {
    if (srcEntry === undefined) {
      console.log('Could not copy from undefined');
      return;
    }
    requestFileSystem(window.PERSISTENT, quota, function (fs) {
      fs.root.getDirectory(rootPath, {}, function (dstEntry) {
        if (dstEntry === undefined) {
          console.log('Could not copy to undefined');
          return;
        }
        srcEntry.copyTo(dstEntry, srcEntry.name, function () {
          console.log('Copy ' + srcEntry.name + ' to ' + dstEntry.name);
        },
        onError);
      });
    },
    onError);
  });
}


function errorToString(error) {
  var msg = '';
  switch (error.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };
  return msg;
}


function main() {
  var module = new Module();
  module.load();
  $('#import').click(importDirectory);
}


$(document).ready(main);
