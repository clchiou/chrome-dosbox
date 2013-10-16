# Copyright (C) 2013 Che-Liang Chiou.


REPOSITORY := svn://svn.code.sf.net/p/dosbox/code-0/dosbox/trunk
REVISION ?= HEAD
WORKING_COPY := dosbox


OUT ?= out


all: | $(WORKING_COPY) $(OUT)


clean:
	rm -rf $(WORKING_COPY) $(OUT)


$(OUT):
	mkdir -p $(OUT)


.PHONY: all clean


### Check out dosbox repository and patch it locally


ifeq ($(REVISION),HEAD)
TARGET := $(REPOSITORY)
else
TARGET := $(REPOSITORY)@$(REVISION)
endif


$(WORKING_COPY):
	svn checkout $(TARGET) $(WORKING_COPY)
