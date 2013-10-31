# Copyright (C) 2013 Che-Liang Chiou.

OUT ?= $(shell pwd)/out
export OUT

REPOSITORY := svn://svn.code.sf.net/p/dosbox/code-0/dosbox/trunk
REVISION ?= HEAD
DOSBOX_ROOT := dosbox

PATCH := $(shell pwd)/dosbox.diff

OUT_DIRS := $(OUT) $(OUT)/chrome-dosbox $(OUT)/obj

CHROME_APP := $(OUT)/chrome-dosbox.zip

APP_SRCS := $(subst chrome,$(OUT)/chrome-dosbox,\
	chrome/manifest.json \
	chrome/dosbox.nmf \
	$(wildcard chrome/*.html) \
	$(wildcard chrome/*.css) \
	$(wildcard chrome/*.js))

DOSBOX_X86_64 := $(OUT)/chrome-dosbox/dosbox-x86_64.nexe
DOSBOX_I686   := $(OUT)/chrome-dosbox/dosbox-i686.nexe
DOSBOX := $(DOSBOX_X86_64) $(DOSBOX_I686)


### Top-level targets

all: $(CHROME_APP) | $(DOSBOX_ROOT) $(OUT_DIRS)


patch:
	cd $(DOSBOX_ROOT) ; svn diff > $(PATCH)

clean:
	rm -rf $(DOSBOX_ROOT) $(OUT)

.PHONY: all patch clean


$(CHROME_APP): $(APP_SRCS) $(DOSBOX)
	@echo Create $$(basename $(CHROME_APP))
	cd $(OUT); zip -r chrome-dosbox.zip chrome-dosbox

$(APP_SRCS) : $(OUT)/chrome-dosbox/% : chrome/% | $(OUT_DIRS)
	@echo Copy chrome/$$(basename $<)
	cp -f $< $@

$(DOSBOX_X86_64): force | $(DOSBOX_ROOT) $(OUT_DIRS)
	@echo Build $$(basename $@)
	NACL_ARCH=x86_64 $(MAKE) -f dosbox.mk $(DOSBOX_X86_64)

$(DOSBOX_I686):   force | $(DOSBOX_ROOT) $(OUT_DIRS)
	@echo Build $$(basename $@)
	NACL_ARCH=i686   $(MAKE) -f dosbox.mk $(DOSBOX_I686)

.PHONY: force


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
