// Copyright (C) 2013 Che-Liang Chiou.


function Module() {
  var self = this;

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


// TODO(clchiou): Warn user that he should not choose symlink; otherwise
// Chrome will silently ignore it :(
function LocalFileSystem() {
  var self = this;

  function requestFileSystem(onFileSystem, onError) {
    onFileSystem(self);
  }
  self.requestFileSystem = requestFileSystem;

  function getDirectory(onDirectory, onError) {
    chrome.fileSystem.chooseEntry({
      type: 'openDirectory',
    }, onDirectory);
  }
  self.getDirectory = getDirectory;

  return self;
}


// TODO(clchiou): Warn user that, to make this work, you have to enable
//  chrome://flags/#enable-syncfs-directory-operation
// flag.  And note that sync'ed data will be under another directory
//  'Chrome Syncable FileSystem Dev'
// instead of the normal
//  'Chrome Syncable FileSystem'
// directory.
function SyncFileSystem(path) {
  var self = this;

  var fs = null;

  function requestFileSystem(onFileSystem, onError) {
    console.log('Request syncfs');
    chrome.syncFileSystem.requestFileSystem(function (fs_) {
      if (chrome.runtime.lastError) {
        onError(chrome.runtime.lastError);
        return;
      }
      fs = fs_;
      onFileSystem(self);
    });
  }
  self.requestFileSystem = requestFileSystem;

  function getDirectory(onDirectory, onError) {
    console.log('Get syncfs directory: path=' + path);
    if (path === '/') {
      onDirectory(fs.root);
    } else {
      fs.root.getDirectory(path, {create: true}, onDirectory, onError);
    }
  }
  self.getDirectory = getDirectory;

  return self;
}


function Html5FileSystem(requestFs, path) {
  var self = this;

  var fs = null;

  function requestFileSystem(onFileSystem, onError) {
    console.log('Request html5fs');
    requestFs(function (fs_) {
      fs = fs_;
      console.log('html5fs: ' + fs.root.toURL());
      onFileSystem(self);
    },
    onError);
  }
  self.requestFileSystem = requestFileSystem;

  function getDirectory(onDirectory, onError) {
    console.log('Get html5fs directory: path=' + path);
    if (path === '/') {
      onDirectory(fs.root);
    } else {
      fs.root.getDirectory(path, {create: true}, onDirectory, onError);
    }
  }
  self.getDirectory = getDirectory;

  return self;
}


function copyDirectory(src, dst, onSuccess, onError_) {
  function onError(caller, error) {
    console.log(caller + ': ' + error.name);
    onError_(error);
  }

  console.log('Request src file system');
  src.requestFileSystem(function () {
    console.log('Request src entry');
    src.getDirectory(function (srcEntry) {
      if (srcEntry === undefined) {
        onError('src.getDirectory',
          {name: 'Could not copy from undefined'});
        return;
      }
      console.log('Request dst file system');
      dst.requestFileSystem(function () {
        console.log('Request dst entry');
        dst.getDirectory(function (dstEntry) {
          if (dstEntry === undefined) {
            onError('dst.getDirectory',
              {name: 'Could not copy to undefined'});
            return;
          }
          console.log('Copy ' + srcEntry.fullPath + ' to ' + dstEntry.fullPath);
          srcEntry.copyTo(dstEntry, null, function () {
            onSuccess();
          },
          onError.bind(this, 'copyTo'));
        },
        onError.bind(this, 'dst.getDirectory'));
      },
      onError.bind(this, 'dst.requestFileSystem'));
    },
    onError.bind(this, 'src.getDirectory'));
  },
  onError.bind(this, 'src.requestFileSystem'));
}


function listDirectory(fileSystem, func) {
  fileSystem.requestFileSystem(function (fs) {
    fs.getDirectory(function (dirEntry) {
      var dirReader = dirEntry.createReader();
      (function readEntries() {
        dirReader.readEntries(function (results) {
          if (results.length) {
            for (var i = 0; i < results.length; i++) {
              func(results[i]);
            }
            readEntries();
          }
        });
      })();
    });
  });
}


function remove(entry) {
  console.log('Remove ' + entry.fullPath);
  if (entry.isFile) {
    entry.remove(function () {
      console.log('File removed');
    }, onError);
  } else {
    entry.removeRecursively(function () {
      console.log('Directory removed');
    }, onError);
  }
}


function onError() {
  console.log('copyDirectory: Failure');
}


function main() {
  // TODO(clchiou): Let pepper.cpp and here read this path from a config file?
  var cDrivePath = '/c_drive';

  // TODO(clchiou): Pass quota (and other information) to NaCl module
  var quota = 1024 * 1024 * 1024; // 1 GB

  function requestHtml5FileSystem(onFileSystem, onError) {
    var requestFs = window.requestFileSystem || window.webkitRequestFileSystem;
    requestFs(window.PRESISTENT, quota, onFileSystem, onError);
  }

  function onSuccess() {
    console.log('copyDirectory: Success');
  }

  $('#import').click(function () {
    console.log('Import Directory');
    copyDirectory(
      new LocalFileSystem(),
      new Html5FileSystem(requestHtml5FileSystem, cDrivePath),
      onSuccess,
      onError);
  });

  $('#download').click(function () {
    console.log('Download C Drive from Google Drive');
    copyDirectory(
      new SyncFileSystem(cDrivePath),
      new Html5FileSystem(requestHtml5FileSystem, '/'),
      onSuccess,
      onError);
  });

  $('#upload').click(function () {
    console.log('Upload C Drive to Google Drive');
    copyDirectory(
      new Html5FileSystem(requestHtml5FileSystem, cDrivePath),
      new SyncFileSystem('/'),
      onSuccess,
      onError);
  });

  $('#remove').click(function () {
    listDirectory(new Html5FileSystem(requestHtml5FileSystem, cDrivePath),
      remove);
  });

  $('#start').click(function () {
    var module = new Module();
    module.load();
  });

  chrome.syncFileSystem.onServiceStatusChanged.addListener(function (details) {
    console.log('onServiceStatusChanged:' +
      ' state=' + details.state +
      ' description=' + details.description);
  });

  chrome.syncFileSystem.onFileStatusChanged.addListener(function (details) {
    console.log('onFileStatusChanged:' +
      ' name=' + details.fileEntry.name +
      ' status=' + details.status +
      ' action=' + details.action +
      ' direction=' + details.direction);
  });
}


$(document).ready(main);
