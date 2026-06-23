#!/usr/bin/env node

import { pathToFileURL } from 'url';

const VERSION = '1.0.0';

export function main(argv) {
  const command = argv[0] || 'init';

  if (command === '--help' || command === '-h' || command === 'help') {
    return 'Usage: tool init [path]';
  }

  if (command === '--version' || command === '-v' || command === 'version') {
    return `v${VERSION}`;
  }

  if (command === 'init') {
    return `init ${argv[1] || '.'}`;
  }

  return `init ${command}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(main(process.argv.slice(2)));
}
