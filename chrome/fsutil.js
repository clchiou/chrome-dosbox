// Copyright (C) 2014 Che-Liang Chiou.


/*global chrome, Log */

var FsUtil = (function (Log) {
  'use strict';
  return {
    copy: function (filer, srcEntry, dstEntry, onSuccess, onError) {
      filer.cp(srcEntry, dstEntry, null, onSuccess, function () {
        var dst = dstEntry.fullPath + '/' + srcEntry.name;
        Log.d('Removing dst and then copying again: dst=' + dst);
        dstEntry.getDirectory(srcEntry.name, {}, function (entry) {
          entry.removeRecursively(function () {
            filer.cp(srcEntry, dstEntry, null, onSuccess, onError);
          }, onError);
        }, onError);
      });
    },

    getLocalDirectory: function (onDirectory, onError) {
      chrome.fileSystem.chooseEntry({
        type: 'openDirectory',
      }, function (dirEntry) {
        if (!dirEntry) {
          Log.e('Could not open local directory');
          if (!onError) {
            onError({name: 'EntryUndefined'});
          }
          return;
        }
        onDirectory(dirEntry);
      });
    },

    openFileOrDirectory: function (fs, path, onSuccess, onError) {
      fs.root.getFile(path, {}, onSuccess, function () {
        fs.root.getDirectory(path, {}, onSuccess, onError);
      });
    },
  };
}(Log));
