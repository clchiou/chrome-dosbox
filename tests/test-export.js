// Copyright (C) 2014 Che-Liang Chiou.


(function($, Export, Unittest) {
  'use strict';

  var cDrivePath = '/data/c_drive';

  var testToDosPath = function() {
    var testData = [
      ['C:\\', ''],
      ['C:\\', '/'],
      ['C:\\', '////'],
      ['C:\\a', '///a'],
      ['C:\\a', 'a'],
      ['C:\\a', 'a/'],
      ['C:\\a', '/a///'],
      ['C:\\a\\b', '///a/b'],
      ['C:\\a\\b', '/a///b/'],
      ['C:\\a\\b\\c', '/a///b/c'],
      ['C:\\a\\b\\c', '/a/b///c///'],
    ];
    for (var i = 0; i < testData.length; i++) {
      Unittest.assertEqual(testData[i][0],
        Export.toDosPath(cDrivePath, testData[i][1]));
    }
  };

  var testToHtml5fsPath = function() {
    var testData = [
      ['/data/c_drive', ''],
      ['/data/c_drive', '\\\\'],
      ['/data/c_drive', 'c:'],
      ['/data/c_drive', 'c:\\'],
      ['/data/c_drive', 'C:\\\\'],
      ['/data/c_drive/a', 'a'],
      ['/data/c_drive/a/b', 'a\\\\b\\\\'],
      ['/data/c_drive/a/b/c', 'a\\\\b\\\\c'],
      ['/data/c_drive/a/b/c', 'a\\\\b\\\\c\\\\\\'],
      ['/data/c_drive/a/b/c/d', 'C:\\a\\b\\c\\d'],
    ];
    for (var i = 0; i < testData.length; i++) {
      Unittest.assertEqual(testData[i][0],
        Export.toHtml5fsPath(cDrivePath, testData[i][1]));
    }
  };

  $(document).ready(function() {
    Unittest.run(
      testToDosPath,
      testToHtml5fsPath
    );
  });
})(jQuery, Export, Unittest);
