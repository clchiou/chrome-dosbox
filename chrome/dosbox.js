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

  function importData(srcEntry, dstEntry) {
    if (dstEntry === undefined) {
      console.log('Could not copy to undefined');
      return;
    }
    srcEntry.copyTo(dstEntry, srcEntry.name, function () {
      console.log('Copy ' + srcEntry.name + ' to ' + dstEntry.name);
    },
    onError);
  }

  function onError(error) {
    console.log('Error: ' + error.name);
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
    // To make this work, you have to enable
    //  chrome://flags/#enable-syncfs-directory-operation
    // flag.  And note that sync'ed data will be under another directory
    //  'Chrome Syncable FileSystem Dev'
    // instead of the normal
    //  'Chrome Syncable FileSystem'
    // directory.
    /*
    chrome.syncFileSystem.requestFileSystem(function (fs) {
      if (chrome.runtime.lastError) {
        console.log('requestFileSystem: ' + chrome.runtime.lastError.message);
        return;
      }
      fs.root.getDirectory(rootPath,
        {create: true},
        importData.bind(this, srcEntry),
        onError);
    });
    */
    requestFileSystem(window.PERSISTENT, quota, function (fs) {
      fs.root.getDirectory(rootPath, {}, importData.bind(this, srcEntry));
    },
    onError);
  });
}


function main() {
  var module = new Module();
  module.load();
  $('#import').click(importDirectory);
}


$(document).ready(main);
