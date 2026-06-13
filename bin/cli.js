#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

// Colors helper
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

const printBanner = () => {
  console.log(`\n${colors.cyan}${colors.bright}┌────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}│             🤖  AGENT-SYSTEM INITIALIZER  🤖            │${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}└────────────────────────────────────────────────────────┘${colors.reset}\n`);
};

const showHelp = () => {
  printBanner();
  console.log(`${colors.bright}Usage:${colors.reset}`);
  console.log('  npx agent-system [command] [options]\n');
  console.log(`${colors.bright}Commands:${colors.reset}`);
  console.log('  init [path]       Initialize agent systems in the target directory (default: current directory)');
  console.log('  help              Show this help message');
  console.log('  version           Show version info\n');
  console.log(`${colors.bright}Options:${colors.reset}`);
  console.log('  -f, --force       Overwrite existing files without prompting');
  console.log('  -h, --help        Show this help message');
  console.log('  -v, --version     Show version info\n');
};

const getVersion = () => {
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return pkg.version;
};

// Recursive file collector
function getAllFiles(dir, baseDir = dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir));
    } else {
      files.push(path.relative(baseDir, fullPath));
    }
  }
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  
  let command = 'init';
  let targetPath = '.';
  let force = false;
  
  // Quick parsing
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help' || arg === 'help') {
      showHelp();
      process.exit(0);
    }
    if (arg === '-v' || arg === '--version' || arg === 'version') {
      console.log(`v${getVersion()}`);
      process.exit(0);
    }
    if (arg === '-f' || arg === '--force') {
      force = true;
    } else if (arg === 'init') {
      command = 'init';
      // If there is another arg after init, treat it as targetPath
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        targetPath = args[i + 1];
        i++;
      }
    } else if (!arg.startsWith('-')) {
      // Positional target directory
      targetPath = arg;
    }
  }

  if (command !== 'init') {
    showHelp();
    process.exit(1);
  }

  const destDir = path.resolve(targetPath);
  printBanner();
  console.log(`${colors.dim}Target Workspace:${colors.reset} ${colors.bright}${destDir}${colors.reset}\n`);

  const ITEMS_TO_COPY = [
    '.agent-system',
    '.agents',
    '.claude',
    '.codex',
    'AGENTS.md',
    'CLAUDE.md'
  ];

  // Resolve list of files to copy
  const filesToCopy = [];
  for (const item of ITEMS_TO_COPY) {
    const srcPath = path.join(packageRoot, item);
    if (!fs.existsSync(srcPath)) continue;
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      const children = getAllFiles(srcPath);
      for (const child of children) {
        filesToCopy.push(path.join(item, child));
      }
    } else {
      filesToCopy.push(item);
    }
  }

  const isInteractive = process.stdout.isTTY && process.stdin.isTTY;
  let rl;
  
  const askOverwrite = async (file) => {
    if (force) return true;
    if (!isInteractive) return false;
    
    if (!rl) {
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    return new Promise((resolve) => {
      rl.question(`${colors.yellow}Conflict:${colors.reset} "${file}" already exists and has modifications. Overwrite? (y/N): `, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  };

  // Copy files
  for (const relPath of filesToCopy) {
    const srcFile = path.join(packageRoot, relPath);
    const destFile = path.join(destDir, relPath);
    
    if (!fs.existsSync(destFile)) {
      // Create directories if necessary
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      console.log(`${colors.green}[CREATED]${colors.reset} ${relPath}`);
    } else {
      const srcBuf = fs.readFileSync(srcFile);
      const destBuf = fs.readFileSync(destFile);
      
      if (srcBuf.equals(destBuf)) {
        console.log(`${colors.cyan}${colors.dim}[IDENTICAL]${colors.reset} ${colors.dim}${relPath}${colors.reset}`);
      } else {
        const overwrite = await askOverwrite(relPath);
        if (overwrite) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`${colors.yellow}[OVERWRITTEN]${colors.reset} ${relPath}`);
        } else {
          console.log(`${colors.red}[SKIPPED]${colors.reset} ${relPath}`);
        }
      }
    }
  }

  if (rl) {
    rl.close();
  }

  // Update .gitignore
  console.log('');
  const gitignorePath = path.join(destDir, '.gitignore');
  const rulesToAppend = [
    '.agent-system/runs/',
    '.agent-system/tmp/',
    '.claude/settings.local.json'
  ];

  if (!fs.existsSync(gitignorePath)) {
    fs.mkdirSync(path.dirname(gitignorePath), { recursive: true });
    fs.writeFileSync(gitignorePath, '# Agent system directories\n' + rulesToAppend.join('\n') + '\n');
    console.log(`${colors.green}[CREATED]${colors.reset} .gitignore with agent-system patterns.`);
  } else {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const lines = content.split('\n').map(l => l.trim());
    const missingRules = rulesToAppend.filter(r => !lines.includes(r));
    
    if (missingRules.length > 0) {
      let toAppend = '\n# Agent system directories\n' + missingRules.join('\n') + '\n';
      fs.appendFileSync(gitignorePath, toAppend);
      console.log(`${colors.yellow}[UPDATED]${colors.reset} .gitignore: Appended missing agent-system patterns.`);
    } else {
      console.log(`${colors.cyan}${colors.dim}[IDENTICAL]${colors.reset} ${colors.dim}.gitignore already contains agent-system patterns.${colors.reset}`);
    }
  }

  console.log(`\n${colors.green}${colors.bright}✔ Agent system environment successfully initialized!${colors.reset}\n`);
  console.log(`${colors.bright}Next steps:${colors.reset}`);
  console.log(`  1. Review and update "${colors.cyan}.agent-system/project/profile.md${colors.reset}" to define your project purpose and commands.`);
  console.log(`  2. Standardize agent rules inside "${colors.cyan}.claude/${colors.reset}", "${colors.cyan}.agents/${colors.reset}", and "${colors.cyan}.codex/${colors.reset}" as needed.\n`);
}

main().catch((err) => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  process.exit(1);
});
