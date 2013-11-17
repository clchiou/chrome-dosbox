# Copyright (C) 2013 Che-Liang Chiou.

OUT ?= $(shell pwd)/out
export OUT

REPOSITORY := svn://svn.code.sf.net/p/dosbox/code-0/dosbox/trunk
REVISION ?= HEAD
DOSBOX_ROOT := dosbox

PATCH := $(shell pwd)/dosbox.diff

OUT_DIRS := \
	$(OUT) \
	$(OUT)/chrome-dosbox \
	$(OUT)/chrome-dosbox/icons \
	$(OUT)/chrome-dosbox/_platform_specific \
	$(OUT)/chrome-dosbox/_platform_specific/x86-64 \
	$(OUT)/chrome-dosbox/_platform_specific/x86-32 \
	$(OUT)/chrome-dosbox/_platform_specific/arm \
	$(OUT)/chrome-dosbox/_platform_specific/all \
	$(OUT)/obj

CHROME_APP := $(OUT)/chrome-dosbox.zip

APP_SRCS := $(subst chrome,$(OUT)/chrome-dosbox,\
	chrome/dosbox.nmf \
	chrome/manifest.json \
	$(wildcard chrome/*.css) \
	$(wildcard chrome/*.dart) \
	$(wildcard chrome/*.html) \
	$(wildcard chrome/*.js) \
	$(wildcard chrome/*.map))


### Top-level targets

all: $(CHROME_APP) | $(DOSBOX_ROOT) $(OUT_DIRS)


test:
	make -C tests

patch:
	cd $(DOSBOX_ROOT) ; svn diff > $(PATCH)

clean:
	rm -rf $(DOSBOX_ROOT) $(OUT)

.PHONY: all test patch clean


$(CHROME_APP): $(APP_SRCS) | build-dosbox
	@echo Create $$(basename $(CHROME_APP))
	cp icons/*.png $(OUT)/chrome-dosbox/icons
	cd $(OUT); zip -r chrome-dosbox.zip chrome-dosbox

$(APP_SRCS) : $(OUT)/chrome-dosbox/% : chrome/% | $(OUT_DIRS)
	@echo Copy chrome/$(<F)
	cp -f $< $@

build-dosbox: | $(DOSBOX_ROOT) $(OUT_DIRS)
	@echo Build dosbox_x86-64
	NACL_ARCH=x86_64 $(MAKE) -f dosbox.mk
	@echo Build dosbox_x86-32
	NACL_ARCH=i686   $(MAKE) -f dosbox.mk
	@echo Build dosbox_arm
	NACL_ARCH=arm    $(MAKE) -f dosbox.mk

.PHONY: build-dosbox


ifeq ($(REVISION),HEAD)
REPO_URL_REV := $(REPOSITORY)
else
REPO_URL_REV := $(REPOSITORY)@$(REVISION)
endif

$(DOSBOX_ROOT):
	svn checkout $(REPO_URL_REV) $(DOSBOX_ROOT)
	cd $(DOSBOX_ROOT) ; patch -p0 < $(PATCH) ; ./autogen.sh

$(OUT_DIRS):
	mkdir -p $@
