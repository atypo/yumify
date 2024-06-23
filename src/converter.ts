// converter.ts
// This file contains the main YumiConverter class that handles the conversion from HTML to Markdown.

import { JSDOM } from 'jsdom';
import {
  atx_closed,
  backslash,
  htmlHeadingRegex,
  lineBeginningRegex,
  spaces,
  underlined,
} from './constants';
import { chomp, abstractInlineConversion, indent, underline } from './helpers';
import { ConverterOptions, TagConversionFunction } from './types';

export class YumiConverter {
  options: ConverterOptions;

  constructor(options: ConverterOptions = {}) {
    this.options = {
      autolinks: true,
      bullets: '*+-',
      codeLanguage: '',
      codeLanguageCallback: null,
      convert: null,
      defaultTitle: false,
      escapeAsterisks: true,
      escapeUnderscores: true,
      escapeMisc: true,
      headingStyle: underlined,
      keepInlineImagesIn: [],
      newlineStyle: spaces,
      strip: null,
      strongEmSymbol: '*',
      subSymbol: '',
      supSymbol: '',
      wrap: false,
      wrapWidth: 80,
      ...options,
    };

    if (this.options.strip && this.options.convert) {
      throw new Error(
        'You may specify either tags to strip or tags to convert, but not both.',
      );
    }
  }

  convert(html: string): string {
    const dom = new JSDOM(html);
    return this.convertElement(dom.window.document.body);
  }

  private convertElement(
    element: HTMLElement,
    convertAsInline: boolean = false,
    childrenOnly: boolean = false,
  ): string {
    let text = '';

    const isHeading = htmlHeadingRegex.test(element.tagName.toLowerCase());

    const isCell = ['td', 'th'].includes(element.tagName.toLowerCase());
    let convertChildrenAsInline = convertAsInline;

    if (!childrenOnly && (isHeading || isCell)) {
      convertChildrenAsInline = true;
    }

    this.removeWhitespaceNodes(element);

    Array.from(element.childNodes).forEach((child) => {
      if (child.nodeType === 8 || child.nodeType === 10) {
        // Skip comments and doctype nodes
        return;
      } else if (child.nodeType === 3) {
        text += this.processText(child as Text);
      } else {
        text += this.convertElement(
          child as HTMLElement,
          convertChildrenAsInline,
        );
      }
    });

    if (!childrenOnly) {
      const convertFn = (this as any)[
        `convert_${element.tagName.toLowerCase()}`
      ] as TagConversionFunction;
      //console.log('convert_' + element.tagName.toLowerCase(), text);
      if (convertFn && this.shouldConvertTag(element.tagName.toLowerCase())) {
        text = convertFn.call(this, element, text, convertAsInline);
        // console.log('text result', text);
      }
    }
    //console.log('ENDRESULT', text);
    return text;
  }

  private removeWhitespaceNodes(element: HTMLElement): void {
    const isNestedNode = (el: HTMLElement | ChildNode): boolean => {
      if (!(el as HTMLElement).tagName) return false;

      return (
        el &&
        [
          'ol',
          'ul',
          'li',
          'table',
          'thead',
          'tbody',
          'tfoot',
          'tr',
          'td',
          'th',
        ].includes((el as HTMLElement).tagName.toLowerCase())
      );
    };

    Array.from(element.childNodes).forEach((el) => {
      const canExtract =
        !el.previousSibling ||
        !el.nextSibling ||
        isNestedNode(el.previousSibling) ||
        isNestedNode(el.nextSibling);
      if (el.nodeType === 3 && el.nodeValue?.trim() === '' && canExtract) {
        el.remove();
      }
    });
  }

  private processText(el: Text): string {
    let text = el.wholeText || '';

    if (!el.parentElement?.closest('pre')) {
      text = text.replace(/[\t ]+/g, ' ');
    }

    if (!el.parentElement?.closest('pre, code, kbd, samp')) {
      text = this.escapeText(text);
    }

    if (
      el.parentElement?.tagName.toLowerCase() === 'li' &&
      (!el.nextSibling ||
        ['ul', 'ol'].includes(el.nextSibling?.nodeName.toLowerCase()))
    ) {
      text = text.trimEnd();
    }
    return text;
  }

  private escapeText(text: string): string {
    if (!text) return '';
    if (this.options.escapeMisc) {
      text = text.replace(/([\\&<`[>~#=+|-])/g, '\\$1');
      text = text.replace(/(\d)([.)])/g, '$1\\$2');
    }
    if (this.options.escapeAsterisks) {
      text = text.replace(/\*/g, '\\*');
    }
    if (this.options.escapeUnderscores) {
      text = text.replace(/_/g, '\\_');
    }
    return text;
  }

  private shouldConvertTag(tag: string): boolean {
    tag = tag.toLowerCase();
    const { strip, convert } = this.options;
    if (strip) {
      return !strip.includes(tag);
    } else if (convert) {
      return convert.includes(tag);
    }
    return true;
  }

  private wrapText(text: string, width: number): string {
    const wrappedLines: string[] = [];
    let currentLine = '';
    text.split(' ').forEach((word) => {
      if (currentLine.length + word.length + 1 > width) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    });
    if (currentLine) {
      wrappedLines.push(currentLine);
    }
    return wrappedLines.join('\n');
  }

  convertHeading(
    level: number,
    text: string,
    convertAsInline: boolean,
  ): string {
    if (convertAsInline) {
      return text;
    }

    const style = this.options.headingStyle?.toLowerCase();
    text = text.trim();
    if (style === underlined && level <= 2) {
      const line = level === 1 ? '=' : '-';
      return underline(text, line);
    }
    const hashes = '#'.repeat(level);
    if (style === atx_closed) {
      return `${hashes} ${text} ${hashes}\n\n`;
    }
    return `${hashes} ${text}\n\n`;
  }

  convert_a(el: HTMLElement, text: string): string {
    const [prefix, suffix, content] = chomp(text);
    if (!content) {
      return '';
    }
    const href = el.getAttribute('href') || '';
    const title = el.getAttribute('title') || '';
    if (
      this.options.autolinks &&
      content.replace(/\\_/g, '_') === href &&
      !title &&
      !this.options.defaultTitle
    ) {
      return `<${href}>`;
    }
    const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
    return href
      ? `${prefix}[${content}](${href}${titlePart})${suffix}`
      : content;
  }

  convert_b = abstractInlineConversion(() => {
    return this.options.strongEmSymbol!.repeat(2);
  });

  convert_blockquote(
    el: HTMLElement,
    text: string,
    convertAsInline: boolean,
  ): string {
    return convertAsInline
      ? text
      : `\n${text.replace(lineBeginningRegex, '> ').trim()}\n\n`;
  }

  convert_br(el: HTMLElement, text: string, convertAsInline: boolean): string {
    return convertAsInline
      ? ''
      : this.options.newlineStyle === backslash
      ? '\\\n'
      : '  \n';
  }

  convert_code = abstractInlineConversion(() => '`');
  convert_del = abstractInlineConversion(() => '~~');
  convert_em = abstractInlineConversion(() => this.options.strongEmSymbol!);
  convert_i = this.convert_em;
  convert_kbd = this.convert_code;
  convert_s = this.convert_del;
  convert_strong = this.convert_b;
  convert_samp = this.convert_code;
  convert_sub = abstractInlineConversion((self) => self.options.subSymbol!);
  convert_sup = abstractInlineConversion((self) => self.options.supSymbol!);

  convert_h1(el: HTMLElement, text: string, convertAsInline: boolean): string {
    return this.convertHeading(1, text, convertAsInline);
  }
  convert_h2(el: HTMLElement, text: string, convertAsInline: boolean): string {
    return this.convertHeading(2, text, convertAsInline);
  }
  convert_h3(el: HTMLElement, text: string, convertAsInline: boolean): string {
    return this.convertHeading(3, text, convertAsInline);
  }
  convert_h4(el: HTMLElement, text: string, convertAsInline: boolean): string {
    return this.convertHeading(4, text, convertAsInline);
  }
  convert_h5(el: HTMLElement, text: string, convertAsInline: boolean): string {
    return this.convertHeading(5, text, convertAsInline);
  }
  convert_h6(el: HTMLElement, text: string, convertAsInline: boolean): string {
    return this.convertHeading(6, text, convertAsInline);
  }

  convert_hr(): string {
    return '\n\n---\n\n';
  }

  convert_img(el: HTMLElement, text: string, convertAsInline: boolean): string {
    const alt = el.getAttribute('alt') || '';
    const src = el.getAttribute('src') || '';
    const title = el.getAttribute('title') || '';
    const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
    if (
      convertAsInline &&
      !this.options.keepInlineImagesIn!.includes(
        el.parentElement?.tagName.toLowerCase() || '',
      )
    ) {
      return alt;
    }
    return `![${alt}](${src}${titlePart})`;
  }

  convert_p(el: HTMLElement, text: string, convertAsInline: boolean): string {
    if (convertAsInline) {
      return text;
    }
    if (this.options.wrap) {
      text = this.wrapText(text, this.options.wrapWidth!);
    }
    return `${text}\n\n`;
  }

  convert_pre(el: HTMLElement, text: string): string {
    if (!text) return '';
    let codeLanguage = this.options.codeLanguage || '';
    if (this.options.codeLanguageCallback) {
      codeLanguage = this.options.codeLanguageCallback(el) || codeLanguage;
    }
    return `\n\`\`\`${codeLanguage}\n${text}\n\`\`\`\n`;
  }

  convert_ul(el: HTMLElement, text: string): string {
    return this.convertList(el, text);
  }

  convert_ol(el: HTMLElement, text: string): string {
    return this.convertList(el, text);
  }

  private convertList(el: HTMLElement, text: string): string {
    const isNested = this.isNestedList(el);
    const needsNewline =
      el.nextSibling &&
      !['ul', 'ol'].includes(el.nextSibling.nodeName.toLowerCase());
    return isNested
      ? `\n${indent(text, 1).trim()}`
      : `${text}${needsNewline ? '\n' : ''}`;
  }

  private isNestedList(el: HTMLElement): boolean {
    let currentEl: HTMLElement | null = el;
    while (currentEl) {
      if (currentEl.tagName.toLowerCase() === 'li') {
        return true;
      }
      currentEl = currentEl.parentElement;
    }
    return false;
  }

  convert_li(el: HTMLElement, text: string): string {
    const parent = el.parentElement;
    if (parent?.tagName.toLowerCase() === 'ol') {
      const start = parseInt(parent.getAttribute('start') || '1', 10);
      const bullet = `${start + Array.from(parent.children).indexOf(el)}.`;
      return `${bullet} ${text.trim()}\n`;
    } else {
      const depth = this.getListDepth(el);
      const bullets = this.options.bullets!;
      const bullet = bullets[depth % bullets.length];
      return `${bullet} ${text.trim()}\n`;
    }
  }

  private getListDepth(el: HTMLElement): number {
    let depth = -1;
    let currentEl: HTMLElement | null = el;
    while (currentEl) {
      if (currentEl.tagName.toLowerCase() === 'ul') {
        depth++;
      }
      currentEl = currentEl.parentElement;
    }
    return depth;
  }

  convert_table(el: HTMLElement, text: string): string {
    return `\n\n${text}\n`;
  }

  convert_caption(el: HTMLElement, text: string): string {
    return `${text}\n`;
  }

  convert_figcaption(el: HTMLElement, text: string): string {
    return `\n\n${text}\n\n`;
  }

  convert_td(el: HTMLElement, text: string): string {
    const colspan = parseInt(el.getAttribute('colspan') || '1', 10);
    return ` ${text.trim().replace(/\n/g, ' ')} |`.repeat(colspan);
  }

  convert_th(el: HTMLElement, text: string): string {
    const colspan = parseInt(el.getAttribute('colspan') || '1', 10);
    return ` ${text.trim().replace(/\n/g, ' ')} |`.repeat(colspan);
  }

  convert_tr(el: HTMLElement, text: string): string {
    const cells = Array.from(el.querySelectorAll('td, th'));
    const isHeaderRow =
      cells.every((cell) => cell.tagName.toLowerCase() === 'th') ||
      (!el.previousSibling && !el.closest('tbody'));
    let overline = '';
    let underline = '';

    if (isHeaderRow && !el.previousSibling) {
      const fullColspan = cells.reduce(
        (sum, cell) => sum + parseInt(cell.getAttribute('colspan') || '1', 10),
        0,
      );
      underline = `| ${'| '.repeat(fullColspan).replace(/\| $/, '')}|\n`;
    } else if (
      !el.previousSibling &&
      (el.closest('table') ||
        (!el.closest('tbody') && !el.closest('table')?.previousSibling))
    ) {
      overline = `| ${'| '
        .repeat(cells.length)
        .replace(/\| $/, '')}|\n| ${'---| '
        .repeat(cells.length)
        .replace(/\| $/, '')}|\n`;
    }

    return `${overline}|${text.trimEnd()}\n${underline}`;
  }
}
