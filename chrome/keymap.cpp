#include <SDL/SDL_keysym.h>

// This table is copied from naclports/src/examples/systems/dosbox

#define MAX_SCANCODES 256

#define Z SDLK_UNKNOWN

SDLKey sdlkey_map[MAX_SCANCODES] = {
/*   0 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		SDLK_BACKSPACE,	SDLK_TAB,
/*  10 */
Z,		Z,		Z,		SDLK_RETURN,	Z,
Z,		SDLK_LSHIFT,	SDLK_LCTRL,	SDLK_LALT,	SDLK_PAUSE,
/*  20 */
SDLK_CAPSLOCK,	Z,		Z,		Z,		Z,
Z,		Z,		SDLK_ESCAPE,	Z,		Z,
/*  30 */
Z,		Z,		SDLK_SPACE,	SDLK_PAGEUP,	SDLK_PAGEDOWN,
SDLK_END,	SDLK_HOME,	SDLK_LEFT,	SDLK_UP,	SDLK_RIGHT,
/*  40 */
SDLK_DOWN,	Z,		SDLK_PRINT,	Z,		Z,
SDLK_INSERT,	SDLK_DELETE,	Z,		SDLK_0,		SDLK_1,
/*  50 */
SDLK_2,		SDLK_3,		SDLK_4,		SDLK_5,		SDLK_6,
SDLK_7,		SDLK_8,		SDLK_9,		Z,		Z,
/*  60 */
Z,		Z,		Z,		Z,		Z,
SDLK_a,		SDLK_b,		SDLK_c,		SDLK_d,		SDLK_e,
/*  70 */
SDLK_f,		SDLK_g,		SDLK_h,		SDLK_i,		SDLK_j,
SDLK_k,		SDLK_l,		SDLK_m,		SDLK_n,		SDLK_o,
/*  80 */
SDLK_p,		SDLK_q,		SDLK_r,		SDLK_s,		SDLK_t,
SDLK_u,		SDLK_v,		SDLK_w,		SDLK_x,		SDLK_y,
/*  90 */
SDLK_z,		SDLK_LSUPER,	SDLK_RSUPER,	SDLK_MENU,	Z,
Z,		SDLK_KP0,	SDLK_KP1,	SDLK_KP2,	SDLK_KP3,
/* 100 */
SDLK_KP4,	SDLK_KP5,	SDLK_KP6,	SDLK_KP7,	SDLK_KP8,
SDLK_KP9,	SDLK_KP_MULTIPLY, SDLK_KP_PLUS,	Z,		SDLK_KP_MINUS,
/* 110 */
SDLK_KP_PERIOD,	SDLK_KP_DIVIDE,	SDLK_F1,	SDLK_F2,	SDLK_F3,
SDLK_F4,	SDLK_F5,	SDLK_F6,	SDLK_F7,	SDLK_F8,
/* 120 */
SDLK_F9,	SDLK_F10,	SDLK_F11,	SDLK_F12,	Z,
Z,		Z,		Z,		Z,		Z,
/* 130 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 140 */
Z,		Z,		Z,		Z,		SDLK_NUMLOCK,
SDLK_SCROLLOCK,	Z,		Z,		Z,		Z,
/* 150 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 160 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 170 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 180 */
Z,		Z,		Z,		Z,		Z,
Z,		SDLK_SEMICOLON,	SDLK_EQUALS,	SDLK_COMMA,	SDLK_MINUS,
/* 190 */
SDLK_PERIOD,	SDLK_SLASH,	SDLK_BACKQUOTE,	Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 200 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 210 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		SDLK_LEFTBRACKET,
/* 220 */
SDLK_BACKSLASH,	SDLK_RIGHTBRACKET, SDLK_QUOTE,	Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 230 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 240 */
Z,		Z,		Z,		Z,		Z,
Z,		Z,		Z,		Z,		Z,
/* 250 */
Z,		Z,		Z,		Z,		Z,
Z
};
