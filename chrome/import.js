// Copyright (C) 2014 Che-Liang Chiou.


var Import = (function (Log, FsUtil) {
  'use strict';
  return {
    importDirectory: function (filer, cDrivePath, onSuccess, onError) {
      Log.d('Selecting import directory');
      FsUtil.getLocalDirectory(function (srcEntry) {
        filer.fs.root.getDirectory(cDrivePath, {create: true},
          function (dstDir) {
            Log.i('Copying files');
            FsUtil.copy(filer, srcEntry, dstDir, onSuccess, onError);
          }, onError);
      }, onError);
    },
  };
}(Log, FsUtil));
