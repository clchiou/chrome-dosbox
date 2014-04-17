// Copyright (C) 2014 Che-Liang Chiou.


Unittest = (function() {
  "use strict";

  var defaultMessage = 'AssertionError';

  var Unittest = {
    assertTrue: function(condition, message) {
      if (!condition) {
        throw message || defaultMessage;
      }
    },

    assertEqual: function(expected, value, message) {
      message = message || defaultMessage;
      Unittest.assertTrue(expected === value,
        message + ': ' + expected + ' !== ' + value);
    },

    run: function() {
      for (var i = 0; i < arguments.length; i++) {
        arguments[i]();
      }
      console.log('Test completed');
    },
  };

  return Unittest;
})();
