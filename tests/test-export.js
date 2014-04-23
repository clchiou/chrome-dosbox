// Copyright (C) 2014 Che-Liang Chiou.


/*global jQuery, Export, Unittest, document */

(function ($, Export, Unittest) {
  'use strict';

  var cDrivePath, tests;

  cDrivePath = '/data/c_drive';

  tests = {
    testGetExportFilepaths: function () {
      var testInput, testOutput, output;
      testInput = ['', 'C:\\', 'C:\\a', 'C:\\a\\b'];
      testOutput = ['/data/c_drive/a', '/data/c_drive/a/b'];
      output = Export.getExportFilepaths(cDrivePath, testInput);
      Unittest.assertArrayEqual(testOutput, output);
    },

    testToDosPath: function () {
      var testData, i;
      testData = [
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
      for (i = 0; i < testData.length; i++) {
        Unittest.assertEqual(testData[i][0],
          Export.toDosPath(cDrivePath, testData[i][1]));
      }
    },

    testToHtml5fsPath: function () {
      var testData, i;
      testData = [
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
      for (i = 0; i < testData.length; i++) {
        Unittest.assertEqual(testData[i][0],
          Export.toHtml5fsPath(cDrivePath, testData[i][1]));
      }
    },
  };

  $(document).ready(function () {
    var widget;
    Unittest.run(tests);
    widget = new Export.Widget('export-files');
    widget.pushAutocompletePath('C:\\');
    widget.pushAutocompletePath('C:\\a');
    widget.pushAutocompletePath('C:\\b');
    widget.pushAutocompletePath('C:\\c');
    widget.pushAutocompletePath('C:\\d');
    widget.addInputBox();
  });
}(jQuery, Export, Unittest));
