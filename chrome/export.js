// Copyright (C) 2014 Che-Liang Chiou.


function Exporter(export_list_id) {
  var self = this;

  var export_list = $(export_list_id);

  function doExport() {
    // TODO(clchiou): Implement doExport.
  }
  self.doExport = doExport;

  function onInputBoxFocus() {
    // Restore text color.
    $(this).css('color', '#000000');
  }

  function onInputBoxKeyup(e) {
    if (e.keyCode == 13) {
      addInputBox().focus();
    }
  }

  function addInputBox() {
    var inputBox = $('<input>', {type: 'text'})
      .addClass('export-list-item')
      .focusin(onInputBoxFocus)
      .keyup(onInputBoxKeyup);
    export_list.append($('<li>').append(inputBox));
    return inputBox;
  }

  // Create the default empty input box.
  addInputBox().css('color', '#979797').val('C:\\');

  return self;
}
