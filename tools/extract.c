/* Copyright (C) 2013 Che-Liang Chiou. */

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Compile with -I/path/to/dosbox/src/gui */
#include "dosbox_splash.h"

int main(void)
{
	uint8_t splash[640 * 400 * 3];

	GIMP_IMAGE_RUN_LENGTH_DECODE(splash,
			gimp_image.rle_pixel_data, 640 * 400, 3);

	size_t size = fwrite(splash, 1, sizeof(splash), stdout);
	if (size < sizeof(splash)) {
		fprintf(stderr, "Could not write the whole image\n");
		return 1;
	}

	return 0;
}
