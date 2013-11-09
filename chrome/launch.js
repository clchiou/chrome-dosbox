// Copyright (C) 2013 Che-Liang Chiou.

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('dosbox.html', {
    bounds: {
      width:  640 + 20,
      height: 400 + 20,
    }
  });
});
