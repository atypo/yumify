// types.ts
// This file contains type definitions for the Yumi project.

export interface ConverterOptions {
  autolinks?: boolean;
  bullets?: string;
  codeLanguage?: string;
  codeLanguageCallback?: ((el: HTMLElement) => string) | null;
  convert?: string[] | null;
  defaultTitle?: boolean;
  escapeAsterisks?: boolean;
  escapeUnderscores?: boolean;
  escapeMisc?: boolean;
  headingStyle?: string;
  keepInlineImagesIn?: string[];
  newlineStyle?: string;
  strip?: string[] | null;
  strongEmSymbol?: string;
  subSymbol?: string;
  supSymbol?: string;
  wrap?: boolean;
  wrapWidth?: number;
}

export type TagConversionFunction = (
  el: HTMLElement,
  text: string,
  convertAsInline: boolean,
) => string;
