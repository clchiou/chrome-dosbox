// Copyright (C) 2014 Che-Liang Chiou.


var Unittest;

Unittest = (function () {
  "use strict";

  var defaultMessage, Unittest;

  defaultMessage = 'AssertionError';

  Unittest = {
    assertTrue: function (condition, message) {
      if (!condition) {
        throw message || defaultMessage;
      }
    },

    assertEqual: function (expected, value, message) {
      message = message || defaultMessage;
      this.assertTrue(expected === value,
        message + ': ' + expected + ' !== ' + value);
    },

    assertArrayEqual: function (expected, value, message) {
      var i;
      message = message || defaultMessage;
      this.assertTrue(expected.length === value.length,
        message + ': length: ' + expected.length + ' !== ' + value.length);
      for (i = 0; i < expected.length; i++) {
        this.assertTrue(expected[i] === value[i],
          message + ': index=' + i + ': ' + expected[i] + ' !== ' + value[i]);
      }
    },

    run: function (tests) {
      var name;
      for (name in tests) {
        if (tests.hasOwnProperty(name)) {
          tests[name]();
          console.log('PASS: ' + name);
        }
      }
      console.log('Test completed');
    },
  };

  return Unittest;
}());
