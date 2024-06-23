// basic-usage.ts
// Example usage of the Yumi library to convert HTML to Markdown.

import { yumi } from '../index';

const html = `
<h1>Welcome to Yumi</h1>
<p>This is an example of converting <strong>HTML</strong> to Markdown using <em>Yumi</em>.</p>
`;

const markdown = yumi(html);
console.log(markdown);
