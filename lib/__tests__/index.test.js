"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
//import { ConversionError } from '../errors/ConversionError';
describe('yumi', () => {
    it('should convert a simple <h1> to Markdown', () => {
        const html = '<h1>Hello World</h1>';
        const result = (0, index_1.yumi)(html);
        expect(result).toBe('Hello World\n===========\n\n');
    });
    it('should convert <h2> to Markdown', () => {
        const html = '<h2>Subheading</h2>';
        const result = (0, index_1.yumi)(html, { headingStyle: '' });
        expect(result).toBe('## Subheading\n\n');
    });
    it('should convert <p> to Markdown', () => {
        const html = '<p>Paragraph</p>';
        const result = (0, index_1.yumi)(html);
        expect(result).toBe('Paragraph\n\n');
    });
    it('should handle multiple HTML elements with styling', () => {
        const html = '<h1>Title</h1><p>Paragraph</p>';
        const result = (0, index_1.yumi)(html);
        expect(result).toBe('Title\n=====\n\nParagraph\n\n');
    });
    it('should handle multiple HTML elements with no styling', () => {
        const html = '<h1>Title</h1><p>Paragraph</p>';
        const result = (0, index_1.yumi)(html, { headingStyle: '' });
        expect(result).toBe('# Title\n\nParagraph\n\n');
    });
    it('should convert html to markdown without parent', () => {
        const html = '<b>Yay</b> <a href="http://github.com">GitHub</a>';
        const result = (0, index_1.yumi)(html);
        expect(result).toBe('**Yay** [GitHub](http://github.com)');
    });
    it('should exclude a tag from becoming links', () => {
        const html = '<b>Yay</b> <a href="http://github.com">GitHub</a>';
        const result = (0, index_1.yumi)(html, { strip: ['a'] });
        expect(result).toBe('**Yay** GitHub');
    });
    it('should convert b tag', () => {
        const html = '<b>Yay</b> <a href="http://github.com">GitHub</a>';
        const result = (0, index_1.yumi)(html, { convert: ['b'] });
        expect(result).toBe('**Yay** GitHub');
    });
    it("should be autolinked when a a tag's contents match its href", () => {
        const html = '<a href="http://github.com">http://github.com</a>';
        const result = (0, index_1.yumi)(html, { autolinks: true });
        expect(result).toBe('<http://github.com>');
    });
    it("should be normallinked when a a tag's contents match its href", () => {
        const html = '<a href="http://github.com">http://githubs.com</a>';
        const result = (0, index_1.yumi)(html, { autolinks: false });
        expect(result).toBe('[http://githubs.com](http://github.com)');
    });
    it("should be add  when a a tag's contents match its href", () => {
        const html = '<a title="My Awesome Title" href="http://github.com">Open My Blog</a>';
        const result = (0, index_1.yumi)(html, { defaultTitle: true });
        expect(result).toBe('[Open My Blog](http://github.com "My Awesome Title")');
    });
    it('should be using plus signed bullets in a list', () => {
        const html = '<ul><li>Item1</li><li>Item2</li><li>Item3</li></ul>';
        const result = (0, index_1.yumi)(html, { bullets: '+' });
        expect(result).toBe('+ Item1\n+ Item2\n+ Item3\n');
    });
    it('should use underscores for strong encoded markdown', () => {
        const html = '<strong>I am a strong sentence</strong>';
        const result = (0, index_1.yumi)(html, { strongEmSymbol: '_' });
        expect(result).toBe('__I am a strong sentence__');
    });
    it('should add python as the code language for a pre tag', () => {
        const html = '<pre>import os</pre>';
        const result = (0, index_1.yumi)(html, { codeLanguage: 'python' });
        expect(result).toBe('\n```python\nimport os\n```\n');
    });
});
//# sourceMappingURL=index.test.js.map