# Copyright (C) 2013 Che-Liang Chiou.

ifeq ($(wildcard config.mk),)
SRC_DIR := .
BUILD_DIR := .
DEST_DIR := .
else
include config.mk
endif

MODULE_LIB := $(BUILD_DIR)/libchromedosbox.a

OBJS := $(patsubst $(SRC_DIR)/%.cpp,$(BUILD_DIR)/%.o,\
	$(wildcard $(SRC_DIR)/*.cpp))


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

$(OBJS) : $(BUILD_DIR)/%.o : $(SRC_DIR)/%.cpp
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -c -o $@ $<
