# Copyright (C) 2013 Che-Liang Chiou.

ifndef NACLPORTS_ROOT
$(error NACLPORTS_ROOT is not defined)
endif

TOP := $(shell pwd)

NACL_ENV := $(NACLPORTS_ROOT)/src/build_tools/nacl_env.sh

REPOSITORY := svn://svn.code.sf.net/p/dosbox/code-0/dosbox/trunk
REVISION ?= HEAD
DOSBOX_ROOT := dosbox

PATCH := $(TOP)/dosbox.diff

OUT ?= out
OUT_DIRS := $(OUT) $(OUT)/chrome-dosbox $(OUT)/obj

CHROME_APP := $(OUT)/chrome-dosbox.zip

APP_SRCS := $(subst chrome,$(OUT)/chrome-dosbox,\
	chrome/manifest.json \
	$(wildcard chrome/*.html) \
	$(wildcard chrome/*.css) \
	$(wildcard chrome/*.js))

DOSBOX_X86_64 := $(OUT)/chrome-dosbox/dosbox-x86_64.nexe
DOSBOX_I686   := $(OUT)/chrome-dosbox/dosbox-i686.nexe
DOSBOX := $(DOSBOX_X86_64) $(DOSBOX_I686)
NACL_SRCS := $(wildcard chrome/*.h chrome/*.cpp)
NACL_LIBS := png sdl zlib


### Top-level targets

all: $(CHROME_APP) | $(DOSBOX_ROOT) $(OUT_DIRS)


patch:
	cd $(DOSBOX_ROOT) ; svn diff > $(PATCH)

clean:
	rm -rf $(DOSBOX_ROOT) $(OUT)

.PHONY: all patch clean


### These build rules should be running OUTSIDE nacl_env.sh

$(CHROME_APP): $(APP_SRCS) | make-dosbox
	cd $(OUT); zip -r chrome-dosbox.zip chrome-dosbox

make-dosbox:
	NACL_ARCH=x86_64 $(NACL_ENV) $(MAKE) $(DOSBOX_X86_64)
	NACL_ARCH=i686   $(NACL_ENV) $(MAKE) $(DOSBOX_I686)

$(APP_SRCS) : $(OUT)/chrome-dosbox/% : chrome/% | $(OUT_DIRS)
	cp -f $< $@

.PHONY: make-dosbox


### These build rules should be running INSIDE nacl_env.sh

BUILD_ROOT  := $(OUT)/dosbox-$(NACL_ARCH)
DOSBOX_NEXE := $(BUILD_ROOT)/src/dosbox.nexe

PPAPI_LIB := $(OUT)/obj/libppapi-$(NACL_ARCH).a
NACL_OBJS := $(patsubst chrome/%.cpp,$(OUT)/obj/%-$(NACL_ARCH).o,\
	$(wildcard chrome/*.cpp))

$(DOSBOX): $(DOSBOX_NEXE) | $(OUT_DIRS)
	cp -f $< $@

$(DOSBOX_NEXE): $(PPAPI_LIB) | make-nacl-libs $(BUILD_ROOT)
	$(MAKE) -C $(BUILD_ROOT)

$(BUILD_ROOT): | $(DOSBOX_ROOT)
	mkdir -p $@
	BUILD_ROOT=$(BUILD_ROOT) \
	DOSBOX_ROOT=$(DOSBOX_ROOT) \
	PPAPI_LIB=$(PPAPI_LIB) \
	./nacl-configure

$(PPAPI_LIB): $(NACL_OBJS)
	$(AR) cr $@ $<

$(NACL_OBJS) : $(OUT)/obj/%-$(NACL_ARCH).o : chrome/%.cpp | $(OUT_DIRS)
	$(CXX) $(CFLAGS) -c -o $@ $<

#
# XXX: We clean up intermediate files (object files, timestamps, etc.) of the
# target architecture in between builds because the build infrastructure of
# naclports cannot build multiple target architectures.
#
# NOTE: I wish I could run `make clean` but naclports will remove everything
# we have just installed (WTF!).  So rm -rf instead.
#
make-nacl-libs:
	$(MAKE) -C $(NACLPORTS_ROOT)/src $(NACL_LIBS)
	rm -rf $(NACLPORTS_ROOT)/src/out/repository
	rm -rf $(NACLPORTS_ROOT)/src/out/stamp

.PHONY: make-nacl-libs


### Check out dosbox repository and patch it locally

ifeq ($(REVISION),HEAD)
REPO_URL_REV := $(REPOSITORY)
else
REPO_URL_REV := $(REPOSITORY)@$(REVISION)
endif

$(DOSBOX_ROOT):
	svn checkout $(REPO_URL_REV) $(DOSBOX_ROOT)
	cd $(DOSBOX_ROOT) ; patch -p0 < $(PATCH) ; ./autogen.sh


### Misc

$(OUT_DIRS):
	mkdir -p $@
