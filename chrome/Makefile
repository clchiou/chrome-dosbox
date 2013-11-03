# Copyright (C) 2013 Che-Liang Chiou.

ifndef NACL_ARCH
$(error NACL_ARCH is not defined)
endif

ifndef PPAPI_LIB
$(error PPAPI_LIB is not defined)
endif

ifndef OUT
$(error OUT is not defined)
endif


NACL_OBJS := $(patsubst %.cpp,$(OUT)/obj/%-$(NACL_ARCH).o,$(wildcard *.cpp))


all: $(PPAPI_LIB)


$(PPAPI_LIB): $(NACL_OBJS)
	$(AR) cr $@ $^

$(NACL_OBJS) : $(OUT)/obj/%-$(NACL_ARCH).o : %.cpp
	@echo Compile chrome/$$(basename $<)
	$(CXX) $(CFLAGS) $(CXXFLAGS) -c -o $@ $<


.PHONY: all
