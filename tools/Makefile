# Copyright (C) 2013 Che-Liang Chiou.


OUT ?= ../out


DOSBOX_SPLASH := ../screenshots/dosbox_splash.png


all: $(DOSBOX_SPLASH)


$(DOSBOX_SPLASH): raw2png.py $(OUT)/extract
	$(OUT)/extract | python raw2png.py $@


$(OUT)/extract: extract.c
	gcc -I../dosbox/src/gui -o $@ $<


.PHONY: all
