# Copyright (C) 2013 Che-Liang Chiou.

ifndef NACLPORTS_ROOT
$(error NACLPORTS_ROOT is not defined)
endif

TOP := $(shell pwd)

NACL_ENV := $(NACLPORTS_ROOT)/src/build_tools/nacl_env.sh

REPOSITORY := svn://svn.code.sf.net/p/dosbox/code-0/dosbox/trunk
REVISION ?= HEAD
WORKING_COPY := dosbox

PATCH := $(TOP)/dosbox.diff

OUT ?= out
OUT_DIRS := $(OUT) $(OUT)/chrome-dosbox $(OUT)/obj

CHROME_APP := $(OUT)/chrome-dosbox.zip

APP_SRCS := $(subst chrome,$(OUT)/chrome-dosbox,\
	chrome/manifest.json \
	$(wildcard chrome/*.html) \
	$(wildcard chrome/*.css) \
	$(wildcard chrome/*.js))

DOSBOX_X86_64 := $(OUT)/chrome-dosbox/dosbox_x86_64.nexe
DOSBOX_I686   := $(OUT)/chrome-dosbox/dosbox_i686.nexe
DOSBOX := $(DOSBOX_X86_64) $(DOSBOX_I686)
NACL_SRCS := $(wildcard chrome/*.h chrome/*.cpp)
NACL_OBJS := $(patsubst chrome/%.cpp,$(OUT)/obj/%.o,$(wildcard chrome/*.cpp))
NACL_LIBS := png sdl zlib


### Top-level targets

all: $(CHROME_APP) | $(WORKING_COPY) $(OUT_DIRS)


patch:
	cd $(WORKING_COPY) ; svn diff > $(PATCH)

clean:
	rm -rf $(WORKING_COPY) $(OUT)

.PHONY: all patch clean


### These build rules should be running OUTSIDE nacl_env.sh

# XXX: Use timestamp because we cannot depend build targets on dosbox_*.nexe,
# which should be running inside nacl_env.sh.
DOSBOX_TIMESTAMP := $(OUT)/timestamp-dosbox

$(CHROME_APP): $(APP_SRCS) $(DOSBOX_TIMESTAMP)
	cd $(OUT); zip -r chrome-dosbox.zip chrome-dosbox

$(DOSBOX_TIMESTAMP): $(NACL_SRCS)
	NACL_ARCH=x86_64 $(NACL_ENV) $(MAKE) $(DOSBOX_X86_64)
	NACL_ARCH=i686   $(NACL_ENV) $(MAKE) $(DOSBOX_I686)
	touch $@

$(APP_SRCS) : $(OUT)/chrome-dosbox/% : chrome/% | $(OUT_DIRS)
	cp -f $< $@


### These build rules should be running INSIDE nacl_env.sh

# XXX: We need a timestamp because we clean up everything after builds.
NACL_LIBS_TIMESTAMP := $(OUT)/timestamp-nacl-libs-$(NACL_ARCH)

$(DOSBOX): $(NACL_OBJS) $(NACL_LIBS_TIMESTAMP) | $(OUT_DIRS)
	$(CXX) $(LDFLAGS) -o $@ $(NACL_OBJS)

$(NACL_OBJS) : $(OUT)/obj/%.o : chrome/%.cpp | $(OUT_DIRS)
	$(CXX) $(CFLAGS) -c -o $@ $<

# XXX: We have to run `make clean` in between builds to clean up intermediate
# files (object files, timestamps, etc.) of the target architecture so that
# we can build for the next target architecture (the build infrastructure of
# naclports does not seem to be able to build multiple target architectures).
$(NACL_LIBS_TIMESTAMP):
	$(MAKE) -C $(NACLPORTS_ROOT)/src $(NACL_LIBS)
	$(MAKE) -C $(NACLPORTS_ROOT)/src clean
	touch $@

.PHONY: $(NACL_LIBS)


### Check out dosbox repository and patch it locally

ifeq ($(REVISION),HEAD)
REPO_URL_REV := $(REPOSITORY)
else
REPO_URL_REV := $(REPOSITORY)@$(REVISION)
endif

$(WORKING_COPY):
	svn checkout $(REPO_URL_REV) $(WORKING_COPY)


### Misc

$(OUT_DIRS):
	mkdir -p $@
