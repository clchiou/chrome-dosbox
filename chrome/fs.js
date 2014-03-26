// Copyright (C) 2014 Che-Liang Chiou.


var TheFiler = new Filer();


function initFiler(main) {
  // TODO(clchiou): Pass quota (and other information) to NaCl module
  var quota = 1024 * 1024 * 1024; // 1 GB

  TheFiler.init({persistent: true, size: quota}, function(fs) {
    console.log('File system initialized.');
    main();
  }, fsOnError);
}


// TODO(clchiou): A global logger for error reporting?
function fsOnError(e) {
  console.log('File system error: ' + e.name);
}


function openFileOrDirectory(path, onSuccess, onError) {
  TheFiler.fs.root.getFile(path, {}, onSuccess, function () {
    TheFiler.fs.root.getDirectory(path, {}, onSuccess, onError);
  });
}


function traverse(path, onEntry, onError) {
  TheFiler.ls(path, function (entries) {
    for (i in entries) {
      onEntry(entries[i]);
    }
    for (i in entries) {
      if (entries[i].isDirectory) {
        traverse(entries[i].fullPath, onEntry, onError);
      }
    }
  }, onError);
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
