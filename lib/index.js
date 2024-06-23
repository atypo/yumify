"use strict";
// index.ts
// The entry point of the Yumi project, providing the markdownify function to convert HTML to Markdown.
Object.defineProperty(exports, "__esModule", { value: true });
exports.yumi = void 0;
const converter_1 = require("./converter");
function yumi(html, options = {}) {
    const converter = new converter_1.YumiConverter(options);
    return converter.convert(html);
}
exports.yumi = yumi;
//# sourceMappingURL=index.js.map