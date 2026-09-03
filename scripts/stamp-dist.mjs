import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const indexPath = resolve('dist/index.html');
const html = readFileSync(indexPath, 'utf8').replace(/\n<!-- deploy:[^>]+-->\n?/g, '\n');
const stamped = html.replace(
  '</html>',
  `\n<!-- deploy:${new Date().toISOString()} -->\n</html>`,
);

writeFileSync(indexPath, stamped);
