# Copyright (C) 2013 Che-Liang Chiou.

OUT ?= $(shell pwd)/out
export OUT

OUT_DIRS := \
	$(OUT) \
	$(OUT)/chrome-dosbox \
	$(OUT)/chrome-dosbox/_platform_specific \
	$(OUT)/chrome-dosbox/_platform_specific/x86-64 \
	$(OUT)/chrome-dosbox/_platform_specific/x86-32 \
	$(OUT)/chrome-dosbox/_platform_specific/arm \
	$(OUT)/chrome-dosbox/_platform_specific/all

CHROME_APP := $(OUT)/chrome-dosbox.zip

DOSBOX := \
	$(OUT)/chrome-dosbox/_platform_specific/x86-64/dosbox_x86-64.nexe \
	$(OUT)/chrome-dosbox/_platform_specific/x86-32/dosbox_x86-32.nexe \
	$(OUT)/chrome-dosbox/_platform_specific/arm/dosbox_arm.nexe \
	$(OUT)/chrome-dosbox/_platform_specific/all/dosbox_x86-64.nexe \
	$(OUT)/chrome-dosbox/_platform_specific/all/dosbox_x86-32.nexe \
	$(OUT)/chrome-dosbox/_platform_specific/all/dosbox_arm.nexe

APP_SRCS := $(subst chrome,$(OUT)/chrome-dosbox,\
	chrome/dosbox.nmf \
	chrome/manifest.json \
	$(wildcard chrome/*.css) \
	$(wildcard chrome/*.html) \
	$(wildcard chrome/*.js) \
	$(wildcard chrome/*.map))

PEPPER_MODULE_SRCS := $(wildcard chrome/*.cc) $(wildcard chrome/*.h)

# Absolute path of chrome/ directory
CHROME_DOSBOX_SRC_DIR := $(shell pwd)/chrome


### Top-level targets

all: $(CHROME_APP) | $(OUT_DIRS)


test:
	make -C tests

clean:
	$(MAKE) -C naclports clean
	rm -rf $(OUT)

.PHONY: all test clean


### Build rules

$(CHROME_APP): $(APP_SRCS) $(DOSBOX)
	@echo Create $$(basename $(CHROME_APP))
	rsync --archive --delete icons $(OUT)/chrome-dosbox
	rsync --archive --delete chrome/css $(OUT)/chrome-dosbox
	cd $(OUT); zip -r chrome-dosbox.zip chrome-dosbox

$(APP_SRCS) : $(OUT)/chrome-dosbox/% : chrome/% | $(OUT_DIRS)
	@echo Copy chrome/$(<F)
	cp -f $< $@

$(DOSBOX): $(PEPPER_MODULE_SRCS)
	# HACK: Remove sentinel of chrome-dosbox to start a rebuild
	if [ -d naclports/out/sentinels ]; then \
		find naclports/out/sentinels -name chrome-dosbox -delete; \
	fi
	cd naclports; \
	CHROME_DOSBOX_SRC_DIR=$(CHROME_DOSBOX_SRC_DIR) \
	CHROME_DOSBOX_INSTALL_DIR=$(OUT)/chrome-dosbox/_platform_specific \
	./make_all.sh dosbox-svn

$(OUT_DIRS):
	mkdir -p $@
