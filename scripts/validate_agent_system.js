#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];

function fail(message) {
  failures.push(message);
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function assertExists(relPath) {
  if (!exists(relPath)) {
    fail(`Missing required file: ${relPath}`);
  }
}

function assertPackageBoundary(pkg) {
  if (pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, 'postinstall')) {
    fail('package.json must not auto-initialize repositories from postinstall');
  }

  const packageFiles = pkg.files || [];
  for (const forbidden of ['.agent-system', '.claude', '.opencode']) {
    if (packageFiles.includes(forbidden)) {
      fail(`package.json files must not include broad local-only directory: ${forbidden}`);
    }
  }

  for (const required of [
    '.agent-system/contracts',
    '.agent-system/core',
    '.agent-system/project/improvement-settings.json',
    '.claude/settings.json',
    '.claude/agents',
    '.claude/skills',
    '.opencode/agents'
  ]) {
    if (!packageFiles.includes(required)) {
      fail(`package.json files is missing expected package entry: ${required}`);
    }
  }

  if (packageFiles.includes('.agent-system/project/profile.md')) {
    fail('package.json must not ship this repository-specific project profile as a target template');
  }
}

function assertNoMissingValidatorReferences() {
  const skillPaths = [
    '.agents/skills/create-candidate-skill/SKILL.md',
    '.claude/skills/create-candidate-skill/SKILL.md'
  ];

  for (const skillPath of skillPaths) {
    const content = readText(skillPath);
    if (content.includes('scripts/validate_agent_system.py')) {
      fail(`${skillPath} references a validator script that does not exist`);
    }
  }
}

function assertCliSafetyHooks() {
  const cli = readText('bin/cli.js');
  for (const expected of [
    'LOCAL_ONLY_PATH_PATTERNS',
    'UPDATE_PROPOSAL_DIR',
    'PROJECT_PROFILE_PATH',
    'defaultProjectProfile',
    'MERGEABLE_JSON_FILES',
    'MERGEABLE_MARKDOWN_FILES',
    'writeUpdateProposal',
    'resolveWorkspacePath',
    'isProtectedRelPath'
  ]) {
    if (!cli.includes(expected)) {
      fail(`bin/cli.js is missing expected safety/merge hook: ${expected}`);
    }
  }
}

function assertGitignoreDefaults() {
  const gitignoreExample = readText('.gitignore.agent-system.example');
  for (const expected of [
    '.agent-system/runs/',
    '.agent-system/tmp/',
    '.agent-system/updates/',
    '.claude/settings.local.json',
    '.gemini/settings.local.json',
    'opencode.local.json'
  ]) {
    if (!gitignoreExample.includes(expected)) {
      fail(`.gitignore.agent-system.example is missing ${expected}`);
    }
  }
}

const pkg = JSON.parse(readText('package.json'));

for (const relPath of [
  'bin/cli.js',
  '.claude/settings.json',
  '.gemini/settings.json',
  'opencode.json',
  '.agents/skills/doitforme/SKILL.md',
  '.claude/skills/doitforme/SKILL.md'
]) {
  assertExists(relPath);
}

assertPackageBoundary(pkg);
assertNoMissingValidatorReferences();
assertCliSafetyHooks();
assertGitignoreDefaults();

if (failures.length > 0) {
  console.error('Agent system validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Agent system validation passed.');
