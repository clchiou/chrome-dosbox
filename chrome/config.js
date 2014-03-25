// Copyright (C) 2014 Che-Liang Chiou.


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
  initFiler();

  $('#accordion').accordion({heightStyle: 'content'});

  // TODO(clchiou): Let pepper.cpp and here read this path from a config file?
  var cDrivePath = '/c_drive';
  var cDriveMountPath = '/data/c_drive';

  var getHtml5Directory = makeGetHtml5Directory(makeRequestHtml5FileSystem(),
      cDrivePath);

  function onSuccess() {
    showStatus('Success');
  }

  $('#do-import').click(function () {
    showStatus('Select import folder...');
    copyDirectory(getLocalDirectory, getHtml5Directory, true,
      function () {
        showStatus('Success. Please Restart DOSBox for new folder.');
      },
      logError);
  });

  $('#do-export').click(function () {
    showStatus('Select destination...');
    copyDirectory(getHtml5Directory, getLocalDirectory, false,
      onSuccess, logError);
  });

  var exporter = new Exporter('#export-files', cDrivePath);
  $('#do-export-files').button().click(exporter.onExportFiles);

  $('#do-remove').button().click(function () {
    showStatus('Clearing...');
    dirForEach(getHtml5Directory, remove, onSuccess, logError);
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


$(document).ready(main);
