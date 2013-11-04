// Copyright (C) 2013 Che-Liang Chiou.


function show(message) {
  $('#status').html(message);
}


function onLoad() {
  show('Loaded');
  $('#nacl-module').focus();
}


function main() {
  var container = $('#nacl-module-container')[0];
  container.addEventListener('load', onLoad, true);
  $('<embed/>', {attr: {
    id: 'nacl-module',
    src: 'dosbox.nmf',
    type: 'application/x-nacl',
    width: 1024,
    height: 768,
  }}).appendTo(container);
}


$(document).ready(main);
