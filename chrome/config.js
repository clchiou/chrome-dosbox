// Copyright (C) 2014 Che-Liang Chiou.


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

  function onSuccess() {
    showStatus('Success');
  }

  $('#do-import').click(function () {
    function doImport(srcDir) {
      TheFiler.fs.root.getDirectory(cDrivePath, {create: true},
        function (dstDir) {
          TheFiler.cp(srcDir, dstDir, null, function () {
            showStatus('Success. Please Restart DOSBox for new directory.');
          }, logError);
        }, logError);
    }
    showStatus('Select import directory...');
    getLocalDirectory(function (srcDir) {
      // If destination directory is not empty, W3C spec says you cannot write
      // to it; so remove destination before copy.
      var dstPath = cDrivePath + '/' + srcDir.name;
      openFileOrDirectory(dstPath, function() {
        TheFiler.rm(dstPath, function () {
          doImport(srcDir);
        }, logError);
      }, function() {
        doImport(srcDir);
      });
    }, logError);
  });

  $('#do-export').click(function () {
    showStatus('Select destination...');
    getLocalDirectory(function (dstDir) {
      TheFiler.fs.root.getDirectory(cDrivePath, {create: true},
        function (srcDir) {
          TheFiler.cp(srcDir, dstDir, null, onSuccess, logError);
        }, logError);
    }, logError);
  });

  var exportWidget = new Export.Widget('export-files');
  exportWidget.loadExportPaths(chrome.storage.sync);
  $('#do-save-export-files-list').button().click(function () {
    exportWidget.saveExportPaths(chrome.storage.sync);
  });
  $('#do-export-files').button().click(function () {
    var dosPaths = exportWidget.getDosPaths();
    Export.exportFiles(TheFiler, cDrivePath, dosPaths);
  });
  Export.getFilePaths(TheFiler, cDrivePath, function (html5fsPath) {
    var dosPath = Export.toDosPath(cDrivePath, html5fsPath);
    exportWidget.pushAutocompletePath(dosPath);
  });

  $('#do-remove').button().click(function () {
    showStatus('Clearing...');
    TheFiler.rm(cDrivePath, onSuccess, logError);
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


$(document).ready(function () {
  initFiler(main);
});
