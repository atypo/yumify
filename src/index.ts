// index.ts
// The entry point of the Yumi project, providing the markdownify function to convert HTML to Markdown.

import { YumiConverter } from './converter';
import { ConverterOptions } from './types';

export function yumi(
  html: string,
  options: ConverterOptions = {}
): string {
  const converter = new YumiConverter(options);
  return converter.convert(html);
}
