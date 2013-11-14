#!/usr/bin/env python
# Copyright (C) 2013 Che-Liang Chiou.

import sys

import numpy as np

from PIL import Image


if len(sys.argv) < 2:
    print 'Usage: %s output_image_filename' % sys.argv[0]
    sys.exit(1)

raw_image = map(ord, sys.stdin.read())
array = np.array(raw_image).reshape(400, 640, 3).astype('uint8')

image = Image.fromarray(array)
image.save(sys.argv[1])
