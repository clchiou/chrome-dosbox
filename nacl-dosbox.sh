#!/bin/bash
# Copyright (C) 2013 Che-Liang Chiou.

if [ -z "${NACLPORTS_ROOT:-}" ]; then
  echo "NACLPORTS_ROOT is not defined"
  exit 1
fi

if [ -z "${DOSBOX:-}" -o -z "${DOSBOX_ROOT:-}" ]; then
  echo "DOSBOX or DOSBOX_ROOT is not defined"
  exit 1
fi

if [ $# -gt 0 ]; then
  echo "Command-line arguments (generally) break nacl_env.sh :("
  echo "Use environment variables instead!"
  exit 1
fi

set -eu

function realpath() {
  local curdir=$(pwd)
  cd "$(dirname $1)"
  local path="$(pwd)"
  cd "${curdir}"
  echo "${path}/$(basename $1)"
}

export PACKAGE_NAME=dosbox-svn
source ${NACLPORTS_ROOT}/src/build_tools/common.sh

export LIBS="$(realpath ${PPAPI_LIB}) -lnacl_io"
export LDFLAGS="$NACLPORTS_LDFLAGS"

# TODO(clchiou): Do we still need this?
HOST=${NACL_CROSS_PREFIX}
if [ ${NACL_ARCH} = "pnacl" ]; then
  # The PNaCl tools use "pnacl-" as the prefix, but config.sub
  # does not know about "pnacl".  It only knows about "le32-nacl".
  # Unfortunately, most of the config.subs here are so old that
  # it doesn't know about that "le32" either.  So we just say "nacl".
  HOST="nacl"
fi

CONFIG_FLAGS="--host=${HOST} \
    --prefix=${NACLPORTS_PREFIX} \
    --exec-prefix=${NACLPORTS_PREFIX} \
    --libdir=${NACLPORTS_LIBDIR} \
    --oldincludedir=${NACLPORTS_INCLUDE} \
    --with-sdl-prefix=${NACLPORTS_PREFIX} \
    --with-sdl-exec-prefix=${NACLPORTS_PREFIX}"

pushd ${DOSBOX_ROOT}
./autogen.sh
./configure ${CONFIG_FLAGS}
make clean
make

popd
cp -f ${DOSBOX_ROOT}/src/dosbox${NACL_EXEEXT} ${DOSBOX}
