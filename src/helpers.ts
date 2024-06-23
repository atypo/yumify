// helpers.ts
// This file contains utility functions used throughout the Yumi project.

import { lineBeginningRegex } from './constants';

export function chomp(text: string): [string, string, string] {
  const prefix = text && text[0] === ' ' ? ' ' : '';
  const suffix = text && text[text.length - 1] === ' ' ? ' ' : '';
  text = text.trim();
  return [prefix, suffix, text];
}

export function abstractInlineConversion(
  markupFn: (self: any) => string,
): (self: any, text: string) => string {
  return function (self, text) {
    const markup = markupFn(self);

    if (!text) return '';

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

export function indent(text: string, level: number): string {
  return text ? text.replace(lineBeginningRegex, '\t'.repeat(level)) : '';
}

export function underline(text: string, padChar: string): string {
  text = (text || '').trimEnd();
  return text ? `${text}\n${padChar.repeat(text.length)}\n\n` : '';
}
