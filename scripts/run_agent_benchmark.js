#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const benchmarkRoot = path.join(repoRoot, '.agent-system', 'evals', 'benchmarks');
const runsRoot = path.join(repoRoot, '.agent-system', 'runs');
const cliPath = path.join(repoRoot, 'bin', 'cli.js');
const maxBuffer = 20 * 1024 * 1024;

function usage() {
  console.log(`Usage:
  npm run benchmark -- --agent doitforme --runs 1
  node scripts/run_agent_benchmark.js --list

Options:
  --agent <name>    Override the case default agent
  --case <id>       Run one benchmark case
  --label <name>    Add a label to the output directory
  --runs <n>        Repeat each selected case n times
  --list            List available benchmark cases without API keys
  --setup-only      Prepare workspace and print prompt without running an agent
  --verify          Verify a previously prepared workspace (requires --case and --workspace)
  --workspace <path> Path to workspace directory (for --verify mode)
`);
}

function parseArgs(argv) {
  const options = {
    agent: null,
    caseId: null,
    label: null,
    runs: 1,
    list: false,
    setupOnly: false,
    doVerify: false,
    workspacePath: null
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--list') {
      options.list = true;
    } else if (arg === '--setup-only') {
      options.setupOnly = true;
    } else if (arg === '--verify') {
      options.doVerify = true;
    } else if (arg === '--agent') {
      options.agent = argv[++i];
    } else if (arg === '--case') {
      options.caseId = argv[++i];
    } else if (arg === '--label') {
      options.label = argv[++i];
    } else if (arg === '--runs') {
      options.runs = Number.parseInt(argv[++i], 10);
    } else if (arg === '--workspace') {
      options.workspacePath = path.resolve(argv[++i]);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.runs) || options.runs < 1) {
    throw new Error('--runs must be a positive integer');
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadCases() {
  if (!fs.existsSync(benchmarkRoot)) {
    return [];
  }

  return fs.readdirSync(benchmarkRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const caseDir = path.join(benchmarkRoot, entry.name);
      const metadata = readJson(path.join(caseDir, 'case.json'));
      return {
        ...metadata,
        caseDir,
        fixturePath: path.join(caseDir, metadata.fixtureDir)
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function sanitizeLabel(label) {
  return String(label || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeExposedBenchmarkCases(workspace) {
  const exposedBenchmarkDir = path.join(workspace, '.agent-system', 'evals', 'benchmarks');
  if (fs.existsSync(exposedBenchmarkDir)) {
    fs.rmSync(exposedBenchmarkDir, { recursive: true, force: true });
  }
}

function prepareWorkspace(testCase, runDir) {
  const workspace = path.join(runDir, 'workspace');
  fs.mkdirSync(runDir, { recursive: true });
  copyDir(testCase.fixturePath, workspace);
  const initResult = runNode([cliPath, 'init', workspace], repoRoot);
  writeCommandLogs(
    initResult,
    path.join(runDir, 'init.stdout.log'),
    path.join(runDir, 'init.stderr.log')
  );
  removeExposedBenchmarkCases(workspace);
  const beforeSnapshot = snapshotFiles(workspace);
  return { workspace, initResult, beforeSnapshot };
}

function prepareBaselineSnapshot(testCase, runDir) {
  const baselineWorkspace = path.join(runDir, 'baseline-workspace');
  copyDir(testCase.fixturePath, baselineWorkspace);
  const initResult = runNode([cliPath, 'init', baselineWorkspace], repoRoot);
  writeCommandLogs(
    initResult,
    path.join(runDir, 'baseline-init.stdout.log'),
    path.join(runDir, 'baseline-init.stderr.log')
  );
  removeExposedBenchmarkCases(baselineWorkspace);
  return {
    initResult,
    beforeSnapshot: snapshotFiles(baselineWorkspace)
  };
}

function normalizeRelPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function shouldSnapshot(relPath) {
  return !(
    relPath === '.git' ||
    relPath.startsWith('.git/') ||
    relPath === 'node_modules' ||
    relPath.startsWith('node_modules/') ||
    relPath.startsWith('.agent-system/runs/') ||
    relPath.startsWith('.agent-system/tmp/')
  );
}

function snapshotFiles(rootDir) {
  const snapshot = new Map();

  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = normalizeRelPath(path.relative(rootDir, fullPath));
      if (!shouldSnapshot(relPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile()) {
        const hash = crypto.createHash('sha256')
          .update(fs.readFileSync(fullPath))
          .digest('hex');
        snapshot.set(relPath, hash);
      }
    }
  }

  visit(rootDir);
  return snapshot;
}

function diffSnapshots(before, after) {
  const changed = new Set();
  for (const [relPath, hash] of after.entries()) {
    if (before.get(relPath) !== hash) {
      changed.add(relPath);
    }
  }
  for (const relPath of before.keys()) {
    if (!after.has(relPath)) {
      changed.add(relPath);
    }
  }
  return [...changed].sort();
}

function runNode(args, cwd, env = process.env) {
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer
  });

  return {
    command: [process.execPath, ...args].join(' '),
    exitCode: result.status === null ? 1 : result.status,
    signal: result.signal,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    elapsedMs: Date.now() - startedAt
  };
}

function runShell(command, cwd) {
  const startedAt = Date.now();
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    maxBuffer
  });

  return {
    command,
    exitCode: result.status === null ? 1 : result.status,
    signal: result.signal,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    elapsedMs: Date.now() - startedAt
  };
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function expandVerificationCommand(command, testCase, workspace) {
  return command
    .replaceAll('{caseDir}', shellQuote(testCase.caseDir))
    .replaceAll('{workspace}', shellQuote(workspace));
}

function readTranscriptMetrics(transcriptPath) {
  const metrics = {
    loopCount: 0,
    toolCallCount: 0,
    rejectedCommandCount: 0
  };

  if (!fs.existsSync(transcriptPath)) {
    return metrics;
  }

  for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.trim()) {
      continue;
    }
    try {
      const event = JSON.parse(line);
      if (event.event === 'tool_call') {
        metrics.toolCallCount++;
      }
      if (event.event === 'command_rejected') {
        metrics.rejectedCommandCount++;
      }
      if (event.event === 'run_finished' && Number.isInteger(event.loopCount)) {
        metrics.loopCount = event.loopCount;
      }
    } catch {
      // Ignore malformed transcript lines; the transcript itself remains for debugging.
    }
  }

  return metrics;
}

function patternMatches(transcript, pattern) {
  try {
    return new RegExp(pattern).test(transcript);
  } catch {
    return transcript.includes(pattern);
  }
}

function writeSummaryMarkdown(summary, filePath) {
  const verificationLines = summary.verification.results
    .map(result => `- ${result.exitCode === 0 ? 'PASS' : 'FAIL'} ${result.command}`)
    .join('\n');
  const requiredLines = summary.safetyEvidence.requiredTranscriptPatterns
    .map(result => `- ${result.matched ? 'PASS' : 'FAIL'} ${result.pattern}`)
    .join('\n');

  const content = `# Benchmark Summary: ${summary.caseId}

- Agent: ${summary.agentName}
- Run: ${summary.runIndex}
- Completion: ${summary.completion.passed ? 'PASS' : 'FAIL'}
- Safety/evidence: ${summary.safetyEvidence.passed ? 'PASS' : 'FAIL'}
- Init exit code: ${summary.setup.exitCode}
- Agent exit code: ${summary.agentRun.exitCode}
- Changed files: ${summary.efficiency.changedFileCount}
- Tool calls: ${summary.efficiency.toolCallCount}
- Loops: ${summary.efficiency.loopCount}
- Rejected commands: ${summary.efficiency.rejectedCommandCount}
- Elapsed ms: ${summary.efficiency.elapsedMs}

## Verification
${verificationLines || '- None'}

## Required Transcript Evidence
${requiredLines || '- None'}

## Changed Files
${summary.changedFiles.map(file => `- ${file}`).join('\n') || '- None'}
`;

  fs.writeFileSync(filePath, content, 'utf8');
}

function scoreRun(testCase, runIndex, runDir, agentName, initResult, agentResult, verificationResults, beforeSnapshot, workspace) {
  const afterSnapshot = snapshotFiles(workspace);
  const changedFiles = diffSnapshots(beforeSnapshot, afterSnapshot);
  const transcriptPath = path.join(runDir, 'transcript.jsonl');
  const transcript = fs.existsSync(transcriptPath) ? fs.readFileSync(transcriptPath, 'utf8') : '';
  const transcriptMetrics = readTranscriptMetrics(transcriptPath);
  const expectedChangedPaths = testCase.expectedChangedPaths || [];
  const forbiddenChangedPaths = testCase.forbiddenChangedPaths || [];
  const requiredTranscriptPatterns = testCase.requiredTranscriptPatterns || [];
  const missingExpectedChanges = expectedChangedPaths.filter(relPath => !changedFiles.includes(relPath));
  const forbiddenChanges = forbiddenChangedPaths.filter(relPath => changedFiles.includes(relPath));
  const requiredPatternResults = requiredTranscriptPatterns.map(pattern => ({
    pattern,
    matched: patternMatches(transcript, pattern)
  }));
  const verificationPassed = verificationResults.every(result => result.exitCode === 0);
  const expectedChangesPassed = missingExpectedChanges.length === 0;
  const transcriptEvidencePassed = requiredPatternResults.every(result => result.matched);

  return {
    caseId: testCase.id,
    title: testCase.title,
    runIndex,
    agentName,
    paths: {
      runDir,
      workspace,
      transcript: transcriptPath
    },
    setup: {
      exitCode: initResult.exitCode,
      signal: initResult.signal,
      stdoutPath: path.join(runDir, 'init.stdout.log'),
      stderrPath: path.join(runDir, 'init.stderr.log')
    },
    agentRun: {
      exitCode: agentResult.exitCode,
      signal: agentResult.signal,
      stdoutPath: path.join(runDir, 'agent.stdout.log'),
      stderrPath: path.join(runDir, 'agent.stderr.log')
    },
    completion: {
      passed: initResult.exitCode === 0 && agentResult.exitCode === 0 && verificationPassed && expectedChangesPassed,
      setupPassed: initResult.exitCode === 0,
      verificationPassed,
      expectedChangesPassed,
      missingExpectedChanges
    },
    safetyEvidence: {
      passed: forbiddenChanges.length === 0 && transcriptEvidencePassed,
      forbiddenChanges,
      requiredTranscriptPatterns: requiredPatternResults
    },
    efficiency: {
      elapsedMs: agentResult.elapsedMs,
      loopCount: transcriptMetrics.loopCount,
      toolCallCount: transcriptMetrics.toolCallCount,
      rejectedCommandCount: transcriptMetrics.rejectedCommandCount,
      changedFileCount: changedFiles.length
    },
    verification: {
      results: verificationResults.map((result, index) => ({
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
        elapsedMs: result.elapsedMs,
        stdoutPath: path.join(runDir, `verify-${index + 1}.stdout.log`),
        stderrPath: path.join(runDir, `verify-${index + 1}.stderr.log`)
      }))
    },
    changedFiles
  };
}

function writeCommandLogs(result, stdoutPath, stderrPath) {
  fs.writeFileSync(stdoutPath, result.stdout, 'utf8');
  fs.writeFileSync(stderrPath, result.stderr, 'utf8');
}

function verifyCase(testCase, workspace, runDir) {
  const { initResult, beforeSnapshot } = prepareBaselineSnapshot(testCase, runDir);

  const verificationResults = (testCase.verificationCommands || []).map((command, index) => {
    const expandedCommand = expandVerificationCommand(command, testCase, workspace);
    const result = runShell(expandedCommand, workspace);
    writeCommandLogs(
      result,
      path.join(runDir, `verify-${index + 1}.stdout.log`),
      path.join(runDir, `verify-${index + 1}.stderr.log`)
    );
    return result;
  });

  const afterSnapshot = snapshotFiles(workspace);
  const changedFiles = diffSnapshots(beforeSnapshot, afterSnapshot);
  const expectedChangedPaths = testCase.expectedChangedPaths || [];
  const forbiddenChangedPaths = testCase.forbiddenChangedPaths || [];
  const missingExpectedChanges = expectedChangedPaths.filter(relPath => !changedFiles.includes(relPath));
  const forbiddenChanges = forbiddenChangedPaths.filter(relPath => changedFiles.includes(relPath));
  const verificationPassed = verificationResults.every(result => result.exitCode === 0);
  const expectedChangesPassed = missingExpectedChanges.length === 0;
  const requiredPatternResults = (testCase.requiredTranscriptPatterns || []).map(pattern => ({
    pattern,
    matched: false
  }));
  const transcriptEvidencePassed = requiredPatternResults.length === 0;

  return {
    caseId: testCase.id,
    title: testCase.title,
    agentName: '(manual agent)',
    runIndex: 0,
    paths: { runDir, workspace },
    setup: {
      exitCode: initResult.exitCode,
      signal: initResult.signal,
      stdoutPath: path.join(runDir, 'baseline-init.stdout.log'),
      stderrPath: path.join(runDir, 'baseline-init.stderr.log')
    },
    agentRun: { exitCode: 0, signal: null, stdoutPath: '', stderrPath: '' },
    completion: {
      passed: initResult.exitCode === 0 && verificationPassed && expectedChangesPassed,
      setupPassed: initResult.exitCode === 0,
      verificationPassed,
      expectedChangesPassed,
      missingExpectedChanges
    },
    safetyEvidence: {
      passed: forbiddenChanges.length === 0 && transcriptEvidencePassed,
      forbiddenChanges,
      requiredTranscriptPatterns: requiredPatternResults,
      transcriptEvidenceAvailable: false
    },
    efficiency: {
      elapsedMs: 0,
      loopCount: 0,
      toolCallCount: 0,
      rejectedCommandCount: 0,
      changedFileCount: changedFiles.length
    },
    verification: {
      results: verificationResults.map((result, index) => ({
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
        elapsedMs: result.elapsedMs,
        stdoutPath: path.join(runDir, `verify-${index + 1}.stdout.log`),
        stderrPath: path.join(runDir, `verify-${index + 1}.stderr.log`)
      }))
    },
    changedFiles
  };
}

function runCase(testCase, runIndex, rootRunDir, options) {
  const caseRunDir = path.join(rootRunDir, `${testCase.id}-run-${runIndex}`);
  const agentName = options.agent || testCase.agent || 'doitforme';
  const transcriptPath = path.join(caseRunDir, 'transcript.jsonl');
  const { workspace, initResult, beforeSnapshot } = prepareWorkspace(testCase, caseRunDir);
  const env = {
    ...process.env,
    AGENT_SYSTEMS_BENCHMARK_AUTO_APPROVE: '1',
    AGENT_SYSTEMS_BENCHMARK_WORKSPACE: workspace,
    AGENT_SYSTEMS_ALLOWED_COMMANDS: JSON.stringify(testCase.allowedCommands || []),
    AGENT_SYSTEMS_TRANSCRIPT_PATH: transcriptPath,
    AGENT_SYSTEMS_STRICT_EXIT: '1'
  };

  const agentResult = runNode([cliPath, 'run', agentName, testCase.prompt], workspace, env);
  writeCommandLogs(
    agentResult,
    path.join(caseRunDir, 'agent.stdout.log'),
    path.join(caseRunDir, 'agent.stderr.log')
  );

  const verificationResults = (testCase.verificationCommands || []).map((command, index) => {
    const expandedCommand = expandVerificationCommand(command, testCase, workspace);
    const result = runShell(expandedCommand, workspace);
    writeCommandLogs(
      result,
      path.join(caseRunDir, `verify-${index + 1}.stdout.log`),
      path.join(caseRunDir, `verify-${index + 1}.stderr.log`)
    );
    return result;
  });

  const summary = scoreRun(
    testCase,
    runIndex,
    caseRunDir,
    agentName,
    initResult,
    agentResult,
    verificationResults,
    beforeSnapshot,
    workspace
  );

  fs.writeFileSync(path.join(caseRunDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  writeSummaryMarkdown(summary, path.join(caseRunDir, 'summary.md'));

  return summary;
}

function writeAggregateSummary(rootRunDir, summaries) {
  const aggregate = {
    createdAt: new Date().toISOString(),
    runDir: rootRunDir,
    totals: {
      runs: summaries.length,
      completionPassed: summaries.filter(summary => summary.completion.passed).length,
      safetyEvidencePassed: summaries.filter(summary => summary.safetyEvidence.passed).length
    },
    runs: summaries
  };

  fs.writeFileSync(path.join(rootRunDir, 'summary.json'), `${JSON.stringify(aggregate, null, 2)}\n`, 'utf8');

  const lines = [
    '# Benchmark Run Summary',
    '',
    `- Runs: ${aggregate.totals.runs}`,
    `- Completion passed: ${aggregate.totals.completionPassed}`,
    `- Safety/evidence passed: ${aggregate.totals.safetyEvidencePassed}`,
    '',
    '| Case | Run | Completion | Safety/Evidence | Tool Calls | Changed Files |',
    '| --- | ---: | --- | --- | ---: | ---: |',
    ...summaries.map(summary => `| ${summary.caseId} | ${summary.runIndex} | ${summary.completion.passed ? 'PASS' : 'FAIL'} | ${summary.safetyEvidence.passed ? 'PASS' : 'FAIL'} | ${summary.efficiency.toolCallCount} | ${summary.efficiency.changedFileCount} |`)
  ];

  fs.writeFileSync(path.join(rootRunDir, 'summary.md'), `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const cases = loadCases();

  if (options.list) {
    for (const testCase of cases) {
      console.log(`${testCase.id}\t${testCase.risk}\t${testCase.agent || 'doitforme'}\t${testCase.title}`);
    }
    return;
  }

  // --- Setup-only mode: prepare workspace for the current agent ---
  if (options.setupOnly) {
    if (!options.caseId) {
      throw new Error('--setup-only requires --case <id>');
    }
    const testCase = cases.find(c => c.id === options.caseId);
    if (!testCase) {
      throw new Error(`No benchmark case found for id: ${options.caseId}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const label = sanitizeLabel(options.label);
    const runDir = path.join(runsRoot, `manual-${testCase.id}-${timestamp}${label ? `-${label}` : ''}`);
    const { workspace } = prepareWorkspace(testCase, runDir);

    console.log(`\nBenchmark Case: ${testCase.id}`);
    console.log(`Title: ${testCase.title}`);
    console.log(`Risk: ${testCase.risk}`);
    console.log(`Workspace: ${workspace}`);
    console.log('─'.repeat(60));
    console.log(`Prompt: ${testCase.prompt}`);
    console.log('─'.repeat(60));
    console.log('Allowed commands:');
    for (const cmd of (testCase.allowedCommands || [])) {
      console.log(`  ${cmd}`);
    }
    if (testCase.expectedChangedPaths && testCase.expectedChangedPaths.length > 0) {
      console.log('Expected changed files:');
      for (const p of testCase.expectedChangedPaths) {
        console.log(`  ${p}`);
      }
    }
    if (testCase.forbiddenChangedPaths && testCase.forbiddenChangedPaths.length > 0) {
      console.log('Forbidden to change:');
      for (const p of testCase.forbiddenChangedPaths) {
        console.log(`  ${p}`);
      }
    }
    console.log('─'.repeat(60));
    console.log(`\nTo verify after making changes, run:\n  node scripts/run_agent_benchmark.js --verify --case ${testCase.id} --workspace ${workspace}\n`);
    return;
  }

  // --- Verify mode: check a workspace against a case ---
  if (options.doVerify) {
    if (!options.caseId || !options.workspacePath) {
      throw new Error('--verify requires --case <id> and --workspace <path>');
    }
    const testCase = cases.find(c => c.id === options.caseId);
    if (!testCase) {
      throw new Error(`No benchmark case found for id: ${options.caseId}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runDir = path.join(runsRoot, `verify-${testCase.id}-${timestamp}`);
    fs.mkdirSync(runDir, { recursive: true });

    const result = verifyCase(testCase, options.workspacePath, runDir);
    fs.writeFileSync(path.join(runDir, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    writeSummaryMarkdown(result, path.join(runDir, 'summary.md'));

    const verdict = result.completion.passed && result.safetyEvidence.passed ? 'PASS' : 'FAIL';
    console.log(`\nCase: ${result.caseId}`);
    console.log(`Title: ${result.title}`);
    console.log(`Completion: ${result.completion.passed ? 'PASS' : 'FAIL'}  (verification=${result.completion.verificationPassed ? 'PASS' : 'FAIL'}, expectedFiles=${result.completion.expectedChangesPassed ? 'PASS' : 'FAIL'})`);
    console.log(`Safety/Evidence: ${result.safetyEvidence.passed ? 'PASS' : 'FAIL'}`);
    if (result.safetyEvidence.forbiddenChanges.length > 0) {
      console.log(`  Forbidden changes detected: ${result.safetyEvidence.forbiddenChanges.join(', ')}`);
    }
    if (result.completion.missingExpectedChanges.length > 0) {
      console.log(`  Missing expected changes: ${result.completion.missingExpectedChanges.join(', ')}`);
    }
    console.log(`Changed files: ${result.changedFiles.join(', ') || 'none'}`);
    console.log('');
    for (const v of result.verification.results) {
      console.log(`  ${v.exitCode === 0 ? 'PASS' : 'FAIL'} ${v.command}`);
    }
    console.log(`\nDetails in: ${runDir}`);

    process.exit(result.completion.passed && result.safetyEvidence.passed ? 0 : 1);
  }

  // --- Full automated mode (requires API keys) ---
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('Full benchmark runs require GEMINI_API_KEY or ANTHROPIC_API_KEY. Use --setup-only to prepare a workspace for manual agent execution, or --list to inspect cases.');
  }

  const selectedCases = options.caseId
    ? cases.filter(testCase => testCase.id === options.caseId)
    : cases;

  if (selectedCases.length === 0) {
    throw new Error(options.caseId ? `No benchmark case found for id: ${options.caseId}` : 'No benchmark cases found.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const label = sanitizeLabel(options.label);
  const rootRunDir = path.join(runsRoot, `benchmark-${timestamp}${label ? `-${label}` : ''}`);
  fs.mkdirSync(rootRunDir, { recursive: true });

  const summaries = [];
  for (const testCase of selectedCases) {
    for (let runIndex = 1; runIndex <= options.runs; runIndex++) {
      console.log(`Running ${testCase.id} (${runIndex}/${options.runs}) with ${options.agent || testCase.agent || 'doitforme'}...`);
      const summary = runCase(testCase, runIndex, rootRunDir, options);
      summaries.push(summary);
      console.log(`  completion=${summary.completion.passed ? 'PASS' : 'FAIL'} safety=${summary.safetyEvidence.passed ? 'PASS' : 'FAIL'} run=${summary.paths.runDir}`);
    }
  }

  writeAggregateSummary(rootRunDir, summaries);
  console.log(`Benchmark output: ${rootRunDir}`);

  const allPassed = summaries.every(summary => summary.completion.passed && summary.safetyEvidence.passed);
  process.exit(allPassed ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.error(`Benchmark error: ${err.message}`);
  process.exit(1);
}
