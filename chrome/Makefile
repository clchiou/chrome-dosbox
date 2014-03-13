# Copyright (C) 2013 Che-Liang Chiou.

ifeq ($(wildcard config.mk),)
SRC_DIR := .
BUILD_DIR := .
DEST_DIR := .
else
include config.mk
endif

MODULE_LIB := $(BUILD_DIR)/libchromedosbox.a

OBJS := $(patsubst $(SRC_DIR)/%.cc,$(BUILD_DIR)/%.o,$(wildcard $(SRC_DIR)/*.cc))


all: $(MODULE_LIB)


install: $(MODULE_LIB)
	install -m 644 $(MODULE_LIB) $(DEST_DIR)/lib

.PHONY: all install


$(MODULE_LIB): $(OBJS)
	$(AR) cr $@ $^
	# HACK: Remove sentinel of dosbox-svn to start a rebuild
	if [ -f "$(DOSBOX_SVN_SENTINEL)" ]; then \
		rm -f $(DOSBOX_SVN_SENTINEL); \
	fi

$(OBJS) : $(BUILD_DIR)/%.o : $(SRC_DIR)/%.cc
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -c -o $@ $<
