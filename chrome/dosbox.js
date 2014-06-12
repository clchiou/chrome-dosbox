// Copyright (C) 2013 Che-Liang Chiou.


/*global chrome, document, window, Promise,
         jQuery, Log, NaClModule, DOSBoxConfig */

(function ($, Log, NaClModule, DOSBoxConfig) {
  'use strict';
  var main, showStartupMessages,
    onLoad, onMessage, onResize, closeWindow,
    containerId, moduleId;

  containerId = 'nacl-module-container';
  moduleId = 'nacl-module';

  main = function () {
    var module;

    // Load DOSBox module
    Log.i('Loading DOSBox');
    module = new NaClModule.Module(containerId, moduleId);
    module.onLoad = onLoad;
    module.onMessage = onMessage;
    module.onUnload = closeWindow;
    module.load('dosbox.nmf');

    // Bind config button.
    $('#config').click(function () {
      chrome.app.window.create('config.html', {
        bounds: {width: 700, height: 700}
      });
    });

    // Resize handler.
    $(window).resize(onResize.bind(null, module));

    // Show startup messages.
    showStartupMessages();
  };

  //// showStartupMessages().

  showStartupMessages = function () {
    var key, fill, index, hints;
    key = DOSBoxConfig.keyShowHint;
    fill = DOSBoxConfig.fill;
    index = 0;
    hints = [
      // Hints of version 0.1.5
      'You may export the C drive as well as selected files and directories.',
      'Type `exit\' on command-line prompt to quit DOSBox.',
      // Hints of version 0.1.4
      'Click the \'?\' mark at the bottom-right corner to import games, ' +
        'config DOSBox, etc.',
    ];
    chrome.storage.local.get(fill([key], true), function (items) {
      if (!items[key]) {
        $('#hint').hide();
        return;
      }
      $('#hint').dialog({
        height: 160,
        modal: true,
        buttons: {
          'Next hint': function () {
            index = (index + 1) % hints.length;
            $(this).text(hints[index]);
          },
          'Dismiss': function () {
            chrome.storage.local.set(fill([key], false));
            $(this).dialog('close');
          },
        },
      }).text(hints[index]);
    });
  };

  //// Module callbacks.

  onLoad = function () {
    var self, argsP, configP;
    self = this;
    $('#nacl-module').focus();
    argsP = new Promise(function (resolve) {
      DOSBoxConfig.args(function (args) {
        Log.d('onLoad: args=' + args);
        resolve(args);
      });
    });
    configP = new Promise(function (resolve) {
      DOSBoxConfig.config(function (config) {
        Log.d('onLoad: config=' + config);
        resolve(config);
      });
    });
    Promise.all([argsP, configP]).then(function (results) {
      var args, config;
      args = results[0];
      config = results[1];
      Log.d('onLoad: postMessage: args=' + args);
      Log.d('onLoad: postMessage: config=' + config);
      if (args) {
        self.postMessage(JSON.stringify({
          type: 'app',
          action: 'args',
          value: args,
        }));
      }
      if (config) {
        self.postMessage(JSON.stringify({
          type: 'app',
          action: 'config',
          value: config,
        }));
      }
      self.postMessage(JSON.stringify({
        type: 'app',
        action: 'start',
      }));
      Log.i('Succeed in loading DOSBox');
    });
  };

  onMessage = function (message) {
    if (typeof message.data !== 'string') {
      Log.w('Message is not a string: message=' + message);
      return;
    }
    Log.d('message=' + message.data);
    message = JSON.parse(message.data);
    if (message.type === 'sys') {
      if (message.action === 'quit') {
        this.unload();
      } else if (message.action === 'log') {
        Log.i(message.level.toUpperCase() + ': ' + message.message);
      } else {
        Log.w('Could not recognize message: message=' + message);
      }
    }
  };

  closeWindow = function () {
    chrome.app.window.current().close();
  };

  //// Window callbacks.

  onResize = function (module) {
    // XXX: Unfortunately <body> element would not automatically enlarge itself
    // to the window size (or do I miss some CSS attributes?), and thus the
    // #nacl-module-container bounding box would be much smaller than the size
    // of the window.  So don't use the size of #nacl-module-container on an
    // resize event; use the window size instead.

    var WIDTH, HEIGHT, ASPECT_RATIO, X_MARGIN, Y_MARGIN, size, width, orig;

    WIDTH = 640;
    HEIGHT = 400;
    ASPECT_RATIO = WIDTH / HEIGHT;
    X_MARGIN = 20;
    Y_MARGIN = 30;

    size = {width: $(window).width(), height: $(window).height()};
    size.width -= X_MARGIN;
    size.height -= Y_MARGIN;
    width = size.width;

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

    // Set module size.
    orig = module.size();
    if (size.width !== orig.width || size.height !== orig.height) {
      module.css(size);
    }

    // Center the module.
    module.css({'padding-left': (width - size.width) / 2});
  };

  $(document).ready(main);
}(jQuery, Log, NaClModule, DOSBoxConfig));
