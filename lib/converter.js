"use strict";
// converter.ts
// This file contains the main YumiConverter class that handles the conversion from HTML to Markdown.
Object.defineProperty(exports, "__esModule", { value: true });
exports.YumiConverter = void 0;
const jsdom_1 = require("jsdom");
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
class YumiConverter {
    options;
    constructor(options = {}) {
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
            headingStyle: constants_1.underlined,
            keepInlineImagesIn: [],
            newlineStyle: constants_1.spaces,
            strip: null,
            strongEmSymbol: '*',
            subSymbol: '',
            supSymbol: '',
            wrap: false,
            wrapWidth: 80,
            ...options,
        };
        if (this.options.strip && this.options.convert) {
            throw new Error('You may specify either tags to strip or tags to convert, but not both.');
        }
    }
    convert(html) {
        const dom = new jsdom_1.JSDOM(html);
        return this.convertElement(dom.window.document.body);
    }
    convertElement(element, convertAsInline = false, childrenOnly = false) {
        let text = '';
        const isHeading = constants_1.htmlHeadingRegex.test(element.tagName.toLowerCase());
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
            }
            else if (child.nodeType === 3) {
                text += this.processText(child);
            }
            else {
                text += this.convertElement(child, convertChildrenAsInline);
            }
        });
        if (!childrenOnly) {
            const convertFn = this[`convert_${element.tagName.toLowerCase()}`];
            //console.log('convert_' + element.tagName.toLowerCase(), text);
            if (convertFn && this.shouldConvertTag(element.tagName.toLowerCase())) {
                text = convertFn.call(this, element, text, convertAsInline);
                // console.log('text result', text);
            }
        }
        //console.log('ENDRESULT', text);
        return text;
    }
    removeWhitespaceNodes(element) {
        const isNestedNode = (el) => {
            if (!el.tagName)
                return false;
            return (el &&
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
                ].includes(el.tagName.toLowerCase()));
        };
        Array.from(element.childNodes).forEach((el) => {
            const canExtract = !el.previousSibling ||
                !el.nextSibling ||
                isNestedNode(el.previousSibling) ||
                isNestedNode(el.nextSibling);
            if (el.nodeType === 3 && el.nodeValue?.trim() === '' && canExtract) {
                el.remove();
            }
        });
    }
    processText(el) {
        let text = el.wholeText || '';
        if (!el.parentElement?.closest('pre')) {
            text = text.replace(/[\t ]+/g, ' ');
        }
        if (!el.parentElement?.closest('pre, code, kbd, samp')) {
            text = this.escapeText(text);
        }
        if (el.parentElement?.tagName.toLowerCase() === 'li' &&
            (!el.nextSibling ||
                ['ul', 'ol'].includes(el.nextSibling?.nodeName.toLowerCase()))) {
            text = text.trimEnd();
        }
        return text;
    }
    escapeText(text) {
        if (!text)
            return '';
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
    shouldConvertTag(tag) {
        tag = tag.toLowerCase();
        const { strip, convert } = this.options;
        if (strip) {
            return !strip.includes(tag);
        }
        else if (convert) {
            return convert.includes(tag);
        }
        return true;
    }
    wrapText(text, width) {
        const wrappedLines = [];
        let currentLine = '';
        text.split(' ').forEach((word) => {
            if (currentLine.length + word.length + 1 > width) {
                wrappedLines.push(currentLine);
                currentLine = word;
            }
            else {
                currentLine += (currentLine ? ' ' : '') + word;
            }
        });
        if (currentLine) {
            wrappedLines.push(currentLine);
        }
        return wrappedLines.join('\n');
    }
    convertHeading(level, text, convertAsInline) {
        if (convertAsInline) {
            return text;
        }
        const style = this.options.headingStyle?.toLowerCase();
        text = text.trim();
        if (style === constants_1.underlined && level <= 2) {
            const line = level === 1 ? '=' : '-';
            return (0, helpers_1.underline)(text, line);
        }
        const hashes = '#'.repeat(level);
        if (style === constants_1.atx_closed) {
            return `${hashes} ${text} ${hashes}\n\n`;
        }
        return `${hashes} ${text}\n\n`;
    }
    convert_a(el, text) {
        const [prefix, suffix, content] = (0, helpers_1.chomp)(text);
        if (!content) {
            return '';
        }
        const href = el.getAttribute('href') || '';
        const title = el.getAttribute('title') || '';
        if (this.options.autolinks &&
            content.replace(/\\_/g, '_') === href &&
            !title &&
            !this.options.defaultTitle) {
            return `<${href}>`;
        }
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        return href
            ? `${prefix}[${content}](${href}${titlePart})${suffix}`
            : content;
    }
    convert_b = (0, helpers_1.abstractInlineConversion)((el) => {
        return this.options.strongEmSymbol.repeat(2);
    });
    convert_blockquote(el, text, convertAsInline) {
        return convertAsInline
            ? text
            : `\n${text.replace(constants_1.lineBeginningRegex, '> ').trim()}\n\n`;
    }
    convert_br(el, text, convertAsInline) {
        return convertAsInline
            ? ''
            : this.options.newlineStyle === constants_1.backslash
                ? '\\\n'
                : '  \n';
    }
    convert_code = (0, helpers_1.abstractInlineConversion)(() => '`');
    convert_del = (0, helpers_1.abstractInlineConversion)(() => '~~');
    convert_em = (0, helpers_1.abstractInlineConversion)(() => this.options.strongEmSymbol);
    convert_i = this.convert_em;
    convert_kbd = this.convert_code;
    convert_s = this.convert_del;
    convert_strong = this.convert_b;
    convert_aside = this.convert_h3;
    convert_samp = this.convert_code;
    convert_sub = (0, helpers_1.abstractInlineConversion)((self) => self.options.subSymbol);
    convert_sup = (0, helpers_1.abstractInlineConversion)((self) => self.options.supSymbol);
    convert_h1(el, text, convertAsInline) {
        return this.convertHeading(1, text, convertAsInline);
    }
    convert_h2(el, text, convertAsInline) {
        return this.convertHeading(2, text, convertAsInline);
    }
    convert_h3(el, text, convertAsInline) {
        return this.convertHeading(3, text, convertAsInline);
    }
    convert_h4(el, text, convertAsInline) {
        return this.convertHeading(4, text, convertAsInline);
    }
    convert_h5(el, text, convertAsInline) {
        return this.convertHeading(5, text, convertAsInline);
    }
    convert_h6(el, text, convertAsInline) {
        return this.convertHeading(6, text, convertAsInline);
    }
    convert_hr() {
        return '\n\n---\n\n';
    }
    convert_img(el, text, convertAsInline) {
        const alt = el.getAttribute('alt') || '';
        const src = el.getAttribute('src') || '';
        const title = el.getAttribute('title') || '';
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        if (convertAsInline &&
            !this.options.keepInlineImagesIn.includes(el.parentElement?.tagName.toLowerCase() || '')) {
            return alt;
        }
        return `![${alt}](${src}${titlePart})`;
    }
    convert_p(el, text, convertAsInline) {
        if (convertAsInline) {
            return text;
        }
        if (this.options.wrap) {
            text = this.wrapText(text, this.options.wrapWidth);
        }
        return `${text}\n\n`;
    }
    convert_pre(el, text) {
        if (!text)
            return '';
        let codeLanguage = this.options.codeLanguage || '';
        if (this.options.codeLanguageCallback) {
            codeLanguage = this.options.codeLanguageCallback(el) || codeLanguage;
        }
        return `\n\`\`\`${codeLanguage}\n${text}\n\`\`\`\n`;
    }
    convert_ul(el, text) {
        return this.convertList(el, text);
    }
    convert_ol(el, text) {
        return this.convertList(el, text);
    }
    convertList(el, text) {
        const isNested = this.isNestedList(el);
        const needsNewline = el.nextSibling &&
            !['ul', 'ol'].includes(el.nextSibling.nodeName.toLowerCase());
        return isNested
            ? `\n${(0, helpers_1.indent)(text, 1).trim()}`
            : `${text}${needsNewline ? '\n' : ''}`;
    }
    isNestedList(el) {
        let currentEl = el;
        while (currentEl) {
            if (currentEl.tagName.toLowerCase() === 'li') {
                return true;
            }
            currentEl = currentEl.parentElement;
        }
        return false;
    }
    convert_li(el, text) {
        const parent = el.parentElement;
        if (parent?.tagName.toLowerCase() === 'ol') {
            const start = parseInt(parent.getAttribute('start') || '1', 10);
            const bullet = `${start + Array.from(parent.children).indexOf(el)}.`;
            return `${bullet} ${text.trim()}\n`;
        }
        else {
            const depth = this.getListDepth(el);
            const bullets = this.options.bullets;
            const bullet = bullets[depth % bullets.length];
            return `${bullet} ${text.trim()}\n`;
        }
    }
    getListDepth(el) {
        let depth = -1;
        let currentEl = el;
        while (currentEl) {
            if (currentEl.tagName.toLowerCase() === 'ul') {
                depth++;
            }
            currentEl = currentEl.parentElement;
        }
        return depth;
    }
    convert_table(el, text) {
        return `\n\n${text}\n`;
    }
    convert_caption(el, text) {
        return `${text}\n`;
    }
    convert_figcaption(el, text) {
        return `\n\n${text}\n\n`;
    }
    convert_td(el, text) {
        const colspan = parseInt(el.getAttribute('colspan') || '1', 10);
        return ` ${text.trim().replace(/\n/g, ' ')} |`.repeat(colspan);
    }
    convert_th(el, text) {
        const colspan = parseInt(el.getAttribute('colspan') || '1', 10);
        return ` ${text.trim().replace(/\n/g, ' ')} |`.repeat(colspan);
    }
    convert_tr(el, text) {
        const cells = Array.from(el.querySelectorAll('td, th'));
        const isHeaderRow = cells.every((cell) => cell.tagName.toLowerCase() === 'th') ||
            (!el.previousSibling && !el.closest('tbody'));
        let overline = '';
        let underline = '';
        if (isHeaderRow && !el.previousSibling) {
            const fullColspan = cells.reduce((sum, cell) => sum + parseInt(cell.getAttribute('colspan') || '1', 10), 0);
            underline = `| ${'| '.repeat(fullColspan).replace(/\| $/, '')}|\n`;
        }
        else if (!el.previousSibling &&
            (el.closest('table') ||
                (!el.closest('tbody') && !el.closest('table')?.previousSibling))) {
            overline = `| ${'| '
                .repeat(cells.length)
                .replace(/\| $/, '')}|\n| ${'---| '
                .repeat(cells.length)
                .replace(/\| $/, '')}|\n`;
        }
        return `${overline}|${text.trimEnd()}\n${underline}`;
    }
}
exports.YumiConverter = YumiConverter;
//# sourceMappingURL=converter.js.map