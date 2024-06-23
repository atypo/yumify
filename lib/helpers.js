"use strict";
// helpers.ts
// This file contains utility functions used throughout the Yumi project.
Object.defineProperty(exports, "__esModule", { value: true });
exports.underline = exports.indent = exports.abstractInlineConversion = exports.chomp = void 0;
const constants_1 = require("./constants");
function chomp(text) {
    const prefix = text && text[0] === ' ' ? ' ' : '';
    const suffix = text && text[text.length - 1] === ' ' ? ' ' : '';
    text = text.trim();
    return [prefix, suffix, text];
}
exports.chomp = chomp;
function abstractInlineConversion(markupFn) {
    return function (self, text) {
        const markup = markupFn(self);
        if (!text)
            return '';
        if (self.closest('pre, code, kbd, samp')) {
            return text;
        }
        const [prefix, suffix, content] = chomp(text);
        if (!content) {
            return '';
        }
        return `${prefix}${markup}${content}${markup}${suffix}`;
    };
}
exports.abstractInlineConversion = abstractInlineConversion;
function indent(text, level) {
    return text ? text.replace(constants_1.lineBeginningRegex, '\t'.repeat(level)) : '';
}
exports.indent = indent;
function underline(text, padChar) {
    text = (text || '').trimEnd();
    return text ? `${text}\n${padChar.repeat(text.length)}\n\n` : '';
}
exports.underline = underline;
//# sourceMappingURL=helpers.js.map