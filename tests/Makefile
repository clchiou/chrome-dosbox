# Copyright (C) 2013 Che-Liang Chiou.

OUT ?= ../out

TEST_DIR := $(OUT)/tests


all: | $(TEST_DIR)
	cp -f $(OUT)/chrome-dosbox/*.css $(TEST_DIR)
	cp -f $(OUT)/chrome-dosbox/*.html $(TEST_DIR)
	cp -f $(OUT)/chrome-dosbox/*.js $(TEST_DIR)
	cp -f $(OUT)/chrome-dosbox/*.map $(TEST_DIR)
	cp -f dosbox-test.nmf $(TEST_DIR)/dosbox.nmf
	cp -f $(OUT)/chrome-dosbox/_platform_specific/all/dosbox_*.nexe $(TEST_DIR)


$(TEST_DIR):
	mkdir -p $@


.PHONY: all
