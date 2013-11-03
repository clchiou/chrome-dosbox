// Copyright (C) 2013 Che-Liang Chiou.

if (navigator.webkitStartDart) {
  navigator.webkitStartDart();
} else {
  var script = document.createElement('script');
  script.src = 'dosbox.dart.js';
  document.body.appendChild(script);
}
