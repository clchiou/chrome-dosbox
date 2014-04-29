// Copyright (C) 2013 Che-Liang Chiou.


/*global chrome */

(function () {
  'use strict';
  chrome.app.runtime.onLaunched.addListener(function () {
    chrome.app.window.create('dosbox.html', {
      bounds: {width: 640 + 20, height: 400 + 30}
    });
  });
}());
