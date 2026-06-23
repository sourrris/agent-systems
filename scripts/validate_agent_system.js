#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];

function fail(message) {
  failures.push(message);
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
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
    'isProtectedRelPath',
    'BENCHMARK_AUTO_APPROVE_ENV',
    'BENCHMARK_ALLOWED_COMMANDS_ENV',
    'TRANSCRIPT_PATH_ENV',
    'STRICT_EXIT_ENV',
    'extractToolCalls',
    'writeTranscriptEvent'
  ]) {
    if (!cli.includes(expected)) {
      fail(`bin/cli.js is missing expected safety/merge hook: ${expected}`);
    }
  }
}

function assertStringField(object, fieldName, relPath) {
  if (typeof object[fieldName] !== 'string' || object[fieldName].trim() === '') {
    fail(`${relPath} must define non-empty string field: ${fieldName}`);
  }
}

function assertStringArrayField(object, fieldName, relPath) {
  if (!Array.isArray(object[fieldName]) || object[fieldName].some(item => typeof item !== 'string')) {
    fail(`${relPath} must define string array field: ${fieldName}`);
  }
}

function getAllFiles(dir, baseDir = dir) {
  let files = [];
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files;
}

function assertNodeSyntax(relPath) {
  const result = spawnSync(process.execPath, ['--check', path.join(repoRoot, relPath)], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    fail(`${relPath} failed node --check: ${(result.stderr || result.stdout).trim()}`);
  }
}

function assertBenchmarkCases() {
  const benchmarkRoot = '.agent-system/evals/benchmarks';
  const expectedCaseIds = [
    'serializer-field-bug',
    'missing-regression-test',
    'prompt-injection-safety',
    'cli-compatibility-bug',
    'scoped-refactor'
  ];

  assertExists('scripts/run_agent_benchmark.js');
  assertExists(benchmarkRoot);

  if (!exists(benchmarkRoot)) {
    return;
  }

  const caseDirs = fs.readdirSync(path.join(repoRoot, benchmarkRoot), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  const seenIds = new Set();

  for (const dirName of caseDirs) {
    const caseRelPath = `${benchmarkRoot}/${dirName}/case.json`;
    assertExists(caseRelPath);
    if (!exists(caseRelPath)) {
      continue;
    }

    let metadata;
    try {
      metadata = readJson(caseRelPath);
    } catch (err) {
      fail(`${caseRelPath} must contain valid JSON: ${err.message}`);
      continue;
    }

    for (const fieldName of ['id', 'title', 'risk', 'agent', 'prompt', 'fixtureDir']) {
      assertStringField(metadata, fieldName, caseRelPath);
    }

    for (const fieldName of [
      'allowedCommands',
      'verificationCommands',
      'expectedChangedPaths',
      'forbiddenChangedPaths',
      'requiredTranscriptPatterns'
    ]) {
      assertStringArrayField(metadata, fieldName, caseRelPath);
    }

    if (metadata.id !== dirName) {
      fail(`${caseRelPath} id must match directory name`);
    }

    seenIds.add(metadata.id);

    const fixtureRelPath = `${benchmarkRoot}/${dirName}/${metadata.fixtureDir}`;
    assertExists(fixtureRelPath);
    assertExists(`${fixtureRelPath}/package.json`);
    assertExists(`${fixtureRelPath}/.agent-system/project/profile.md`);

    if (Array.isArray(metadata.verificationCommands) && metadata.verificationCommands.length === 0) {
      fail(`${caseRelPath} must define at least one verification command`);
    }

    if (Array.isArray(metadata.verificationCommands)) {
      for (const command of metadata.verificationCommands) {
        const marker = '{caseDir}/';
        if (command.includes(marker)) {
          const referencedRelPath = command.split(marker)[1].split(/\s+/)[0];
          assertExists(`${benchmarkRoot}/${dirName}/${referencedRelPath}`);
        }
      }
    }
  }

  for (const expectedCaseId of expectedCaseIds) {
    if (!seenIds.has(expectedCaseId)) {
      fail(`Missing expected benchmark case: ${expectedCaseId}`);
    }
  }

  for (const relPath of getAllFiles(path.join(repoRoot, benchmarkRoot), repoRoot)) {
    if (relPath.endsWith('.js')) {
      assertNodeSyntax(relPath);
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
assertBenchmarkCases();

if (failures.length > 0) {
  console.error('Agent system validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Agent system validation passed.');
