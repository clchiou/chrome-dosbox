// Copyright (C) 2014 Che-Liang Chiou.


/*global jQuery, Log, document */

(function ($, Log) {
  'use strict';
  $(document).ready(function () {
    $('#error').button().click(function () {
      var message = $('#message').val();
      Log.e(message);
    });
    $('#debug').button().click(function () {
      var message = $('#message').val();
      Log.d(message);
    });
  });
}(jQuery, Log));
