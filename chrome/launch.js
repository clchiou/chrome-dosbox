// Copyright (C) 2013 Che-Liang Chiou.

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('dosbox.html', {
    bounds: {
      width:  1024,
      height: 768
    }
  });
});
