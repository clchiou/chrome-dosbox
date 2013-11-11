# Copyright (C) 2013 Che-Liang Chiou.

ifndef NACL_ARCH
$(error NACL_ARCH is not defined)
endif

ifndef NACLPORTS_ROOT
$(error NACLPORTS_ROOT is not defined)
endif

ifndef OUT
$(error OUT is not defined)
endif


NACL_ENV := $(NACLPORTS_ROOT)/src/build_tools/nacl_env.sh

DOSBOX_X86_64 := $(OUT)/chrome-dosbox/dosbox-x86_64.nexe
DOSBOX_I686   := $(OUT)/chrome-dosbox/dosbox-i686.nexe
DOSBOX := $(DOSBOX_X86_64) $(DOSBOX_I686)

DOSBOX_ROOT := dosbox
BUILD_ROOT  := $(OUT)/dosbox-$(NACL_ARCH)
DOSBOX_NEXE := $(BUILD_ROOT)/src/dosbox.nexe

NACL_LIBS := boost png sdl tar zlib

PPAPI_LIB := $(OUT)/obj/libppapi-$(NACL_ARCH).a
export PPAPI_LIB

# TODO(clchiou): Get this path from naclports/.../common.sh?
HEADER := toolchain/linux_x86_newlib/$(NACL_ARCH)-nacl/usr/include
CXXFLAGS := $(CXXFLAGS) -I$(NACL_SDK_ROOT)/$(HEADER)
export CXXFLAGS


$(DOSBOX): $(DOSBOX_NEXE)
	cp -f $< $@

$(DOSBOX_NEXE): | make-dosbox

make-dosbox: $(PPAPI_LIB) $(BUILD_ROOT)/Makefile | make-nacl-libs
	$(NACL_ENV) $(MAKE) -C $(BUILD_ROOT)

#
# XXX: We clean up intermediate files (object files, timestamps, etc.) of the
# target architecture in between builds because the build infrastructure of
# naclports cannot build multiple target architectures (especially when building
# Regal).
#
# NOTE: I wish I could run `make clean` but naclports will remove everything
# we have just installed (WTF!).  So rm -rf instead.
#
make-nacl-libs:
	@echo Build $(NACL_ARCH) libraries $(NACL_LIBS)
	rm -rf $(NACLPORTS_ROOT)/src/out/repository
	rm -rf $(NACLPORTS_ROOT)/src/out/stamp
	$(MAKE) -C $(NACLPORTS_ROOT)/src $(NACL_LIBS)

$(PPAPI_LIB): force
	$(NACL_ENV) $(MAKE) -C chrome

$(BUILD_ROOT)/Makefile: | $(BUILD_ROOT)
	BUILD_ROOT=$(BUILD_ROOT) \
	DOSBOX_ROOT=$(DOSBOX_ROOT) \
	PPAPI_LIB=$(PPAPI_LIB) \
	$(NACL_ENV) ./nacl-configure

$(BUILD_ROOT):
	mkdir -p $@

.PHONY: make-dosbox make-nacl-libs force
