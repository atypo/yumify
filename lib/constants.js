"use strict";
// constants.ts
// This file contains constant values used throughout the Yumi project.
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlHeadingRegex = exports.whitespaceRegex = exports.lineBeginningRegex = exports.convertHeadingRegex = exports.underscore = exports.asterisk = exports.backslash = exports.spaces = exports.underlined = exports.atx_closed = void 0;
exports.atx_closed = 'atx_closed';
exports.underlined = 'underlined';
exports.spaces = 'spaces';
exports.backslash = 'backslash';
exports.asterisk = '*';
exports.underscore = '_';
// Regular expressions
exports.convertHeadingRegex = /convert_h(\d+)/;
exports.lineBeginningRegex = /^/gm;
exports.whitespaceRegex = /[\t ]+/g;
exports.htmlHeadingRegex = /h[1-6]/;
//# sourceMappingURL=constants.js.map