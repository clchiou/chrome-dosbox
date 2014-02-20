// Copyright (C) 2013 Che-Liang Chiou.


var WIDTH = 640;
var HEIGHT = 400;
var ASPECT_RATIO = WIDTH / HEIGHT;

var X_MARGIN = 20;
var Y_MARGIN = 30;


function Module() {
  var self = this;

  var container = null;
  var module = null;

  function load() {
    container = $('#nacl-module-container')[0];
    container.addEventListener('load', onLoad, true);
    container.addEventListener('message', onMessage, true);
    $('<embed/>', {attr: {
      id: 'nacl-module',
      src: 'dosbox.nmf',
      type: 'application/x-nacl',
    }}).addClass('nacl-module').appendTo(container);
  }
  self.load = load;

  function unload() {
    container.removeEventListener('load', onLoad, true);
    container.removeEventListener('message', onMessage, true);
    $('#nacl-module').remove();
    container = null;
    module = null;
    if (self.onUnload) {
      self.onUnload();
    }
  }
  self.unload = unload;

  function size() {
    var m = $('#nacl-module');
    return {width: m.width(), height: m.height()};
  }
  self.size = size;

  function setCss(size) {
    $('#nacl-module').css(size);
  }
  self.setCss = setCss;

  function postMessage(message) {
    module.postMessage(message);
  }
  self.postMessage = postMessage;

  function onLoad() {
    $('#nacl-module').focus();
    module = $('#nacl-module')[0];
    showStatus('DOSBox loaded');
  }

  function onMessage(message) {
    if (typeof message.data !== 'string') {
      console.log('Message is not a string: message=' + message);
      return;
    }
    console.log('message=' + message.data);
    message = JSON.parse(message.data);
    if (message.type === 'sys') {
      if (message.action === 'quit') {
        unload();
        return;
      } else if (message.action === 'log') {
        showStatus(message.level.toUpperCase() + ': ' + message.message);
        return;
      }
    }
  }

  return self;
}


function exit() {
  showStatus('Exit');
  chrome.app.window.current().close();
}


function showStatus(message) {
  $('#status').text(message).fadeOut(8000, function() {
    $('#status').text('').show();
  });
}


function main() {
  showStatus('Loading DOSBox...');
  var module = new Module();
  module.onUnload = exit;
  module.load();

  $('#config').click(function () {
    chrome.app.window.create('config.html', {
      bounds: {
        width:  800,
        height: 600,
      }
    });
  });

  function onResize() {
    // XXX: Unfortunately <body> element would not automatically enlarge itself
    // to the window size (or do I miss some CSS attributes?), and thus the
    // #nacl-module-container bounding box would be much smaller than the size
    // of the window.  So don't use the size of #nacl-module-container on an
    // resize event; use the window size instead.
    var size = {width: $(window).width(), height: $(window).height()};
    size.width -= X_MARGIN;
    size.height -= Y_MARGIN;

    var width = size.width;

    // Honor aspect ratio.
    if (size.width > ASPECT_RATIO * size.height) {
      size.width = ASPECT_RATIO * size.height;
    } else if (size.width / ASPECT_RATIO < size.height) {
      size.height = size.width / ASPECT_RATIO;
    }

    // Check minimum size.
    if (size.width < WIDTH || size.height < HEIGHT) {
      size = {width: WIDTH, height: HEIGHT};
    }

    var orig = module.size();
    if (size.width !== orig.width || size.height !== orig.height) {
      module.setCss(size);
    }

    // Center the element.
    module.setCss({'padding-left': (width - size.width) / 2});
  }

  $(window).resize(onResize);
}


$(document).ready(main);
