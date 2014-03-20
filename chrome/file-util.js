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
  traverse(false, getDirectory, onEntry, onSuccess, onError);
}


function traverse(recursive, getDirectory, onEntry, onSuccess, onError) {
  function onDirectory(dirEntry) {
    var dirReader = dirEntry.createReader();

    function readEntries() {
      dirReader.readEntries(function (results) {
        if (results.length) {
          for (var i = 0; i < results.length; i++) {
            onEntry(results[i]);
            if (recursive && results[i].isDirectory) {
              onDirectory(results[i]);
            }
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
