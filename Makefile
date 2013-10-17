# Copyright (C) 2013 Che-Liang Chiou.


TOP := $(shell pwd)


REPOSITORY := svn://svn.code.sf.net/p/dosbox/code-0/dosbox/trunk
REVISION ?= HEAD
WORKING_COPY := dosbox


PATCH := $(TOP)/dosbox.diff


OUT ?= out
OUT_DIRS := $(OUT) $(OUT)/pack


TARGETS	:= $(subst chrome,$(OUT)/pack,chrome/manifest.json \
		$(wildcard chrome/*.html) \
		$(wildcard chrome/*.css) \
		$(wildcard chrome/*.js))


all: $(TARGETS) | $(WORKING_COPY) $(OUT_DIRS)


patch:
	cd $(WORKING_COPY) ; svn diff > $(PATCH)


clean:
	rm -rf $(WORKING_COPY) $(OUT)


.PHONY: all patch clean


$(OUT_DIRS):
	mkdir -p $@


$(TARGETS) : $(OUT)/pack/% : chrome/% | $(OUT_DIRS)
	cp -f $< $@


### Check out dosbox repository and patch it locally


ifeq ($(REVISION),HEAD)
TARGET := $(REPOSITORY)
else
TARGET := $(REPOSITORY)@$(REVISION)
endif


$(WORKING_COPY):
	svn checkout $(TARGET) $(WORKING_COPY)
