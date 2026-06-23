#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import os from 'os';
import https from 'https';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

const LOCAL_ONLY_PATH_PATTERNS = [
  /(^|\/)\.DS_Store$/,
  /(^|\/)[^/]*\.local\.json$/,
  /(^|\/)\.agent-system\/(runs|tmp|updates)(\/|$)/,
  /(^|\/)\.opencode\/\.gitignore$/,
  /(^|\/)[^/]*\.(log|tmp)$/
];

const UPDATE_PROPOSAL_DIR = '.agent-system/updates';
const PROJECT_PROFILE_PATH = '.agent-system/project/profile.md';
const BENCHMARK_AUTO_APPROVE_ENV = 'AGENT_SYSTEMS_BENCHMARK_AUTO_APPROVE';
const BENCHMARK_WORKSPACE_ENV = 'AGENT_SYSTEMS_BENCHMARK_WORKSPACE';
const BENCHMARK_ALLOWED_COMMANDS_ENV = 'AGENT_SYSTEMS_ALLOWED_COMMANDS';
const TRANSCRIPT_PATH_ENV = 'AGENT_SYSTEMS_TRANSCRIPT_PATH';
const STRICT_EXIT_ENV = 'AGENT_SYSTEMS_STRICT_EXIT';

const MERGEABLE_JSON_FILES = new Set([
  '.claude/settings.json',
  '.gemini/settings.json',
  'opencode.json'
]);

const MERGEABLE_MARKDOWN_FILES = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'OPENCODE.md',
  '.github/copilot-instructions.md'
]);

const PROTECTED_PATH_PATTERNS = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)secrets(\/|$)/,
  /(^|\/)credentials(\/|$)/,
  /(^|\/)[^/]*\.pem$/,
  /(^|\/)[^/]*\.key$/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)dist(\/|$)/,
  /(^|\/)build(\/|$)/,
  /(^|\/)vendor(\/|$)/
];

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
  console.log('  run <agent> [msg] Run a custom agent (e.g. doitforme) in the current workspace');
  console.log('  help              Show this help message');
  console.log('  version           Show version info\n');
  console.log(`${colors.bright}Options:${colors.reset}`);
  console.log('  -f, --force       Accepted for compatibility; existing files are not overwritten');
  console.log('  -g, --global      Initialize globally in the home directory (system-wide installation)');
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

function normalizeRelPath(relPath) {
  return relPath.split(path.sep).join('/').replace(/\\/g, '/');
}

function shouldCopyTemplate(relPath) {
  const normalized = normalizeRelPath(relPath);
  if (normalized === PROJECT_PROFILE_PATH) {
    return false;
  }
  return !LOCAL_ONLY_PATH_PATTERNS.some(pattern => pattern.test(normalized));
}

function isInsideDir(baseDir, targetPath) {
  const relative = path.relative(baseDir, targetPath);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function isProtectedRelPath(relPath) {
  const normalized = normalizeRelPath(relPath).replace(/^\.?\//, '');
  return PROTECTED_PATH_PATTERNS.some(pattern => pattern.test(normalized));
}

function resolveWorkspacePath(destDir, rawPath) {
  const resolvedPath = path.resolve(destDir, rawPath || '.');
  if (!isInsideDir(destDir, resolvedPath)) {
    throw new Error(`Path escapes the workspace: ${rawPath}`);
  }

  const relativePath = normalizeRelPath(path.relative(destDir, resolvedPath));
  if (relativePath && isProtectedRelPath(relativePath)) {
    throw new Error(`Protected path cannot be accessed: ${rawPath}`);
  }

  return resolvedPath;
}

function parseStringListEnv(name) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => typeof item === 'string');
    }
  } catch {
    // Fall back to line-delimited values for manual use.
  }

  return rawValue
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
}

function getBenchmarkConfig(destDir) {
  const workspaceRaw = process.env[BENCHMARK_WORKSPACE_ENV];
  const workspace = workspaceRaw ? path.resolve(workspaceRaw) : null;
  const autoApprove =
    process.env[BENCHMARK_AUTO_APPROVE_ENV] === '1' &&
    workspace &&
    isInsideDir(workspace, destDir);

  return {
    autoApprove,
    workspace,
    allowedCommands: parseStringListEnv(BENCHMARK_ALLOWED_COMMANDS_ENV),
    strictExit: process.env[STRICT_EXIT_ENV] === '1'
  };
}

function writeTranscriptEvent(event) {
  const transcriptPath = process.env[TRANSCRIPT_PATH_ENV];
  if (!transcriptPath) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    ...event
  };
  fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
  fs.appendFileSync(transcriptPath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function extractToolCalls(responseText) {
  const toolCalls = [];
  const toolCallPattern = /<tool_call name="([^"]+)">([\s\S]*?)<\/tool_call>/g;
  let match;

  while ((match = toolCallPattern.exec(responseText)) !== null) {
    toolCalls.push({
      name: match[1].trim(),
      content: match[2]
    });
  }

  return toolCalls;
}

function mergeJsonValue(existingValue, templateValue) {
  if (Array.isArray(existingValue) && Array.isArray(templateValue)) {
    const merged = [...existingValue];
    for (const item of templateValue) {
      if (!merged.some(existingItem => JSON.stringify(existingItem) === JSON.stringify(item))) {
        merged.push(item);
      }
    }
    return merged;
  }

  if (
    existingValue &&
    templateValue &&
    typeof existingValue === 'object' &&
    typeof templateValue === 'object' &&
    !Array.isArray(existingValue) &&
    !Array.isArray(templateValue)
  ) {
    const merged = { ...existingValue };
    for (const [key, value] of Object.entries(templateValue)) {
      merged[key] = key in merged ? mergeJsonValue(merged[key], value) : value;
    }
    return merged;
  }

  return existingValue === undefined ? templateValue : existingValue;
}

function mergeJsonFile(srcFile, destFile) {
  const existingJson = JSON.parse(fs.readFileSync(destFile, 'utf8'));
  const templateJson = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  const mergedJson = mergeJsonValue(existingJson, templateJson);
  const mergedContent = `${JSON.stringify(mergedJson, null, 2)}\n`;
  const currentContent = fs.readFileSync(destFile, 'utf8');

  if (currentContent === mergedContent) {
    return false;
  }

  fs.writeFileSync(destFile, mergedContent, 'utf8');
  return true;
}

function defaultProjectProfile() {
  return `# Project Profile

This profile should be customized for this repository.

## Repository purpose

TODO: Describe what this repository builds or maintains.

## Technology

- Primary languages: TODO
- Frameworks: TODO
- Package manager: TODO
- Runtime versions: TODO
- Database and infrastructure: TODO

## Commands

Use exact commands.

\`\`\`bash
# Install dependencies
TODO

# Run tests
TODO

# Run lint/type checks
TODO
\`\`\`

## Architecture boundaries

- TODO: List important source, test, generated, and configuration boundaries.

## Coding conventions

- Inspect existing patterns before changing code.
- Keep patches small and focused.
- Preserve unrelated user changes.

## Protected and sensitive paths

Never inspect or expose secrets. Avoid editing generated or vendored content.

\`\`\`text
.env
.env.*
secrets/
credentials/
**/*.pem
**/*.key
node_modules/
dist/
build/
vendor/
\`\`\`

## Risk classification overrides

Always classify these as high risk:

- TODO: Add repository-specific high-risk areas.

## Definition of done

A change is complete only when:

1. acceptance criteria are satisfied;
2. the narrowest useful checks pass;
3. no unrelated changes were introduced;
4. remaining uncertainty is reported honestly.
`;
}

function writeTemplateFile(relPath, srcFile, destFile) {
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.copyFileSync(srcFile, destFile);
}

function ensureProjectProfile(destDir) {
  const profilePath = path.join(destDir, PROJECT_PROFILE_PATH);
  if (fs.existsSync(profilePath)) {
    return false;
  }

  fs.mkdirSync(path.dirname(profilePath), { recursive: true });
  fs.writeFileSync(profilePath, defaultProjectProfile(), 'utf8');
  return true;
}

function mergeMarkdownFile(relPath, srcFile, destFile) {
  const startMarker = `<!-- agent-systems:${relPath}:start -->`;
  const endMarker = `<!-- agent-systems:${relPath}:end -->`;
  const templateContent = fs.readFileSync(srcFile, 'utf8').trim();
  const managedBlock = `${startMarker}\n${templateContent}\n${endMarker}`;
  const existingContent = fs.readFileSync(destFile, 'utf8');

  let mergedContent;
  const startIndex = existingContent.indexOf(startMarker);
  const endIndex = existingContent.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    mergedContent =
      existingContent.slice(0, startIndex) +
      managedBlock +
      existingContent.slice(endIndex + endMarker.length);
  } else if (existingContent.includes(templateContent)) {
    return false;
  } else {
    return null;
  }

  if (existingContent === mergedContent) {
    return false;
  }

  fs.writeFileSync(destFile, mergedContent, 'utf8');
  return true;
}

function writeUpdateProposal(destDir, relPath, srcFile) {
  const proposalRelPath = normalizeRelPath(path.join(UPDATE_PROPOSAL_DIR, relPath));
  const proposalFile = path.join(destDir, proposalRelPath);
  const content =
    normalizeRelPath(relPath) === PROJECT_PROFILE_PATH
      ? Buffer.from(defaultProjectProfile(), 'utf8')
      : fs.readFileSync(srcFile);

  if (fs.existsSync(proposalFile) && fs.readFileSync(proposalFile).equals(content)) {
    return { relPath: proposalRelPath, changed: false };
  }

  fs.mkdirSync(path.dirname(proposalFile), { recursive: true });
  fs.writeFileSync(proposalFile, content);
  return { relPath: proposalRelPath, changed: true };
}

// HTTP request helper using native https module
function makeRequest(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`API responded with status code ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

// Gemini API integration
async function callGemini(systemInstruction, messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.2
    }
  };

  const responseText = await makeRequest(url, {}, body);
  const resultJson = JSON.parse(responseText);
  
  if (resultJson.candidates && resultJson.candidates[0] && resultJson.candidates[0].content && resultJson.candidates[0].content.parts[0]) {
    return resultJson.candidates[0].content.parts[0].text;
  }
  throw new Error(`Unexpected Gemini response format: ${responseText}`);
}

// Anthropic API integration
async function callAnthropic(systemInstruction, messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');

  const url = 'https://api.anthropic.com/v1/messages';
  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  };

  const body = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: systemInstruction,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  };

  const responseText = await makeRequest(url, headers, body);
  const resultJson = JSON.parse(responseText);

  if (resultJson.content && resultJson.content[0] && resultJson.content[0].text) {
    return resultJson.content[0].text;
  }
  throw new Error(`Unexpected Anthropic response format: ${responseText}`);
}

// Master LLM Router
async function callLLM(systemInstruction, messages) {
  if (process.env.GEMINI_API_KEY) {
    return await callGemini(systemInstruction, messages);
  } else if (process.env.ANTHROPIC_API_KEY) {
    return await callAnthropic(systemInstruction, messages);
  } else {
    throw new Error('Please set GEMINI_API_KEY or ANTHROPIC_API_KEY environment variable.');
  }
}

// Load configurations from current dir or global home directory
function loadAgentInstructions(agentName, destDir) {
  let systemInstructions = '';

  const filesToLoad = [
    'AGENTS.md',
    '.agent-system/core/operating-protocol.md',
    '.agent-system/core/orchestration.md',
    '.agent-system/core/quality-gates.md',
    '.agent-system/core/security-policy.md',
    '.agent-system/core/self-improvement.md',
    '.agent-system/project/profile.md'
  ];

  for (const relPath of filesToLoad) {
    let filePath = path.join(destDir, relPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(os.homedir(), relPath);
    }
    if (fs.existsSync(filePath)) {
      systemInstructions += `\n=== ${relPath} ===\n${fs.readFileSync(filePath, 'utf8')}\n`;
    }
  }

  const agentPaths = [
    path.join(destDir, '.claude', 'agents', `${agentName}.md`),
    path.join(destDir, '.codex', 'agents', `${agentName}.toml`),
    path.join(destDir, '.opencode', 'agents', `${agentName}.md`),
    path.join(os.homedir(), '.claude', 'agents', `${agentName}.md`),
    path.join(os.homedir(), '.codex', 'agents', `${agentName}.toml`),
    path.join(os.homedir(), '.opencode', 'agents', `${agentName}.md`)
  ];

  let agentInstructions = '';
  for (const aPath of agentPaths) {
    if (fs.existsSync(aPath)) {
      agentInstructions = fs.readFileSync(aPath, 'utf8');
      break;
    }
  }

  if (!agentInstructions) {
    console.warn(`${colors.yellow}Warning:${colors.reset} Custom instructions for agent "${agentName}" not found. Running with core system guidelines only.`);
  }

  return {
    systemInstructions: systemInstructions.trim(),
    agentInstructions: agentInstructions.trim()
  };
}

// Tool Definition Schema description for LLM system prompt
const TOOLS_DEFINITION = `
You have access to the following tools in your environment. You can call them by outputting an XML block in your response. 

Available Tools:
1. read_file:
   Usage: <tool_call name="read_file">path/to/file</tool_call>
2. write_file:
   Usage: <tool_call name="write_file">
   <path>path/to/file</path>
   <content>file_content_here</content>
   </tool_call>
3. run_command:
   Usage: <tool_call name="run_command">command_to_run</tool_call>
4. list_dir:
   Usage: <tool_call name="list_dir">path/to/dir</tool_call>
5. grep_search:
   Usage: <tool_call name="grep_search">
   <query>search_query</query>
   <path>path/to/search</path>
   </tool_call>

Safety Notice: All writes and shell commands will require manual approval from the user in their terminal before execution.
`;

function askConfirmation(rl, message) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${colors.bright}?${colors.reset} ${message} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Tool Executor
async function executeTool(name, content, rl, destDir) {
  console.log(`\n${colors.cyan}${colors.bright}🔧 [Executing Tool: ${name}]${colors.reset}`);
  const benchmarkConfig = getBenchmarkConfig(destDir);
  
  if (name === 'read_file') {
    const rawPath = content.trim();
    try {
      const filePath = resolveWorkspacePath(destDir, rawPath);
      if (!fs.existsSync(filePath)) {
        return `Error: File does not exist at ${rawPath}`;
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return `File ${rawPath} read successfully:\n${data}`;
    } catch (err) {
      return `Error reading file: ${err.message}`;
    }
  }

  if (name === 'write_file') {
    const pathMatch = content.match(/<path>([\s\S]*?)<\/path>/);
    const contentMatch = content.match(/<content>([\s\S]*?)<\/content>/);
    if (!pathMatch || !contentMatch) {
      return `Error: write_file call must include <path> and <content> tags.`;
    }
    const rawPath = pathMatch[1].trim();
    const fileContent = contentMatch[1];
    let filePath;
    try {
      filePath = resolveWorkspacePath(destDir, rawPath);
    } catch (err) {
      return `Error writing file: ${err.message}`;
    }

    const approved =
      benchmarkConfig.autoApprove &&
      benchmarkConfig.workspace &&
      isInsideDir(benchmarkConfig.workspace, filePath)
        ? true
        : await askConfirmation(rl, `Approve writing/updating file "${rawPath}"?`);
    if (!approved) {
      return `User rejected the write operation to "${rawPath}".`;
    }

    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, fileContent, 'utf8');
      return `File ${rawPath} written successfully.`;
    } catch (err) {
      return `Error writing file: ${err.message}`;
    }
  }

  if (name === 'run_command') {
    const cmd = content.trim();
    let approved;
    if (benchmarkConfig.autoApprove) {
      approved = benchmarkConfig.allowedCommands.includes(cmd);
      writeTranscriptEvent({
        event: approved ? 'command_approved' : 'command_rejected',
        command: cmd,
        reason: approved ? 'benchmark allowlist match' : 'not in benchmark allowlist'
      });
    } else {
      approved = await askConfirmation(rl, `Approve running shell command: "${colors.bright}${cmd}${colors.reset}"?`);
    }

    if (!approved) {
      if (benchmarkConfig.autoApprove) {
        return `Benchmark rejected execution of command not in allowlist: "${cmd}".`;
      }
      return `User rejected execution of command: "${cmd}".`;
    }

    return new Promise((resolve) => {
      exec(cmd, { cwd: destDir }, (err, stdout, stderr) => {
        let result = '';
        if (stdout) result += `STDOUT:\n${stdout}\n`;
        if (stderr) result += `STDERR:\n${stderr}\n`;
        if (err) result += `Command failed with exit code ${err.code || 1}\n`;
        writeTranscriptEvent({
          event: 'command_finished',
          command: cmd,
          exitCode: err ? err.code || 1 : 0
        });
        resolve(result || 'Command finished with no output.');
      });
    });
  }

  if (name === 'list_dir') {
    const rawPath = content.trim() || '.';
    try {
      const dirPath = resolveWorkspacePath(destDir, rawPath);
      if (!fs.existsSync(dirPath)) {
        return `Error: Directory does not exist at ${rawPath}`;
      }
      const items = fs.readdirSync(dirPath);
      const list = items.map(item => {
        const full = path.join(dirPath, item);
        const stat = fs.statSync(full);
        return `${stat.isDirectory() ? '[DIR]' : '[FILE]'} ${item}`;
      });
      return `Directory listing of "${rawPath}":\n${list.join('\n')}`;
    } catch (err) {
      return `Error listing directory: ${err.message}`;
    }
  }

  if (name === 'grep_search') {
    const queryMatch = content.match(/<query>([\s\S]*?)<\/query>/);
    const pathMatch = content.match(/<path>([\s\S]*?)<\/path>/);
    if (!queryMatch) {
      return `Error: grep_search call must include a <query> tag.`;
    }
    const query = queryMatch[1];
    const rawPath = pathMatch ? pathMatch[1].trim() : '.';
    
    try {
      const searchPath = resolveWorkspacePath(destDir, rawPath);
      let results = [];
      function searchDir(dir) {
        if (!fs.existsSync(dir)) return;
        const list = fs.readdirSync(dir);
        for (const item of list) {
          if (item === 'node_modules' || item === '.git') continue;
          const full = path.join(dir, item);
          const relativePath = normalizeRelPath(path.relative(destDir, full));
          if (isProtectedRelPath(relativePath)) continue;
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            searchDir(full);
          } else {
            const fileContent = fs.readFileSync(full, 'utf8');
            if (fileContent.includes(query)) {
              const lines = fileContent.split('\n');
              lines.forEach((line, index) => {
                if (line.includes(query)) {
                  results.push(`${path.relative(destDir, full)}:${index + 1}: ${line.trim()}`);
                }
              });
            }
          }
        }
      }
      searchDir(searchPath);
      return results.length > 0 
        ? `Found matches for "${query}" in "${rawPath}":\n${results.slice(0, 50).join('\n')}` 
        : `No matches found for "${query}" in "${rawPath}".`;
    } catch (err) {
      return `Error searching files: ${err.message}`;
    }
  }

  return `Error: Unknown tool "${name}"`;
}

// Autonomous Agent execution loop
async function runAgent(agentName, initialPrompt) {
  const destDir = process.cwd();
  const { systemInstructions, agentInstructions } = loadAgentInstructions(agentName, destDir);
  const fullSystemPrompt = `${systemInstructions}\n\n=== Agent Persona: ${agentName} ===\n${agentInstructions}\n\n${TOOLS_DEFINITION}`;
  const benchmarkConfig = getBenchmarkConfig(destDir);
  
  const messages = [
    { role: 'user', content: initialPrompt }
  ];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n${colors.cyan}${colors.bright}🤖 Starting Agent Loop for: ${agentName}${colors.reset}`);
  console.log(`${colors.dim}Using LLM Provider...${colors.reset}\n`);

  let loopCount = 0;
  const maxLoops = 20;
  let finished = false;
  let errorMessage = null;

  writeTranscriptEvent({
    event: 'run_started',
    agent: agentName,
    benchmarkMode: !!benchmarkConfig.autoApprove
  });

  try {
    while (loopCount < maxLoops) {
      loopCount++;
      console.log(`\n${colors.cyan}${colors.bright}--- Step ${loopCount} ---${colors.reset}`);
      
      const responseText = await callLLM(fullSystemPrompt, messages);
      writeTranscriptEvent({
        event: 'assistant_response',
        agent: agentName,
        loop: loopCount,
        text: responseText
      });
      
      console.log(`\n${colors.magenta}${colors.bright}Assistant:${colors.reset}\n${responseText}\n`);
      
      messages.push({ role: 'assistant', content: responseText });
      
      const toolCalls = extractToolCalls(responseText);
      
      if (toolCalls.length > 0) {
        const toolOutputs = [];
        for (const toolCall of toolCalls) {
          writeTranscriptEvent({
            event: 'tool_call',
            agent: agentName,
            loop: loopCount,
            toolName: toolCall.name,
            content: toolCall.content
          });

          const toolResult = await executeTool(toolCall.name, toolCall.content, rl, destDir);

          writeTranscriptEvent({
            event: 'tool_output',
            agent: agentName,
            loop: loopCount,
            toolName: toolCall.name,
            output: toolResult
          });

          console.log(`\n${colors.green}${colors.bright}🔧 [Tool Output]${colors.reset}\n${toolResult}\n`);

          toolOutputs.push(`[Tool Output for ${toolCall.name}]:\n${toolResult}`);
        }

        messages.push({
          role: 'user',
          content: toolOutputs.join('\n\n')
        });
      } else {
        console.log(`\n${colors.green}${colors.bright}✔ Agent finished its execution loop.${colors.reset}\n`);
        finished = true;
        break;
      }
    }
    
    if (loopCount >= maxLoops) {
      console.warn(`${colors.yellow}Warning: Agent reached maximum loop iterations (${maxLoops}).${colors.reset}\n`);
    }
  } catch (err) {
    errorMessage = err.message;
    console.error(`\n${colors.red}${colors.bright}Error during execution: ${err.message}${colors.reset}\n`);
  } finally {
    rl.close();
    writeTranscriptEvent({
      event: 'run_finished',
      agent: agentName,
      loopCount,
      finished,
      reachedMaxLoops: loopCount >= maxLoops && !finished,
      error: errorMessage
    });
  }

  return {
    success: finished,
    loopCount,
    reachedMaxLoops: loopCount >= maxLoops && !finished,
    error: errorMessage
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  let command = 'init';
  let targetPath = null;
  let isGlobal = false;
  let agentName = null;
  let runPrompt = null;
  
  if (args[0] === 'run') {
    command = 'run';
    let positionalIdx = 1;
    while (positionalIdx < args.length && args[positionalIdx].startsWith('-')) {
      positionalIdx++;
    }
    if (positionalIdx < args.length) {
      agentName = args[positionalIdx];
      runPrompt = args.slice(positionalIdx + 1).join(' ');
    }
  } else {
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
        // Kept for CLI compatibility. Existing files are preserved.
      } else if (arg === '-g' || arg === '--global') {
        isGlobal = true;
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
  }

  if (command === 'run') {
    if (!agentName) {
      console.error(`${colors.red}Error: Please specify the agent name to run.${colors.reset}`);
      console.log('Usage: npx agent-system run <agent-name> [prompt]');
      process.exit(1);
    }
    
    if (!runPrompt) {
      const rlPrompt = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      runPrompt = await new Promise((resolve) => {
        rlPrompt.question(`Enter the task for agent "${agentName}": `, (answer) => {
          resolve(answer.trim());
        });
      });
      rlPrompt.close();
      
      if (!runPrompt) {
        console.error(`${colors.red}Error: Task prompt cannot be empty.${colors.reset}`);
        process.exit(1);
      }
    }
    
    const runResult = await runAgent(agentName, runPrompt);
    if (process.env[STRICT_EXIT_ENV] === '1' && !runResult.success) {
      process.exit(1);
    }
    process.exit(0);
  }

  if (command !== 'init') {
    showHelp();
    process.exit(1);
  }

  // Resolve target directory
  if (isGlobal) {
    targetPath = os.homedir();
  } else if (!targetPath) {
    if (process.env.INIT_CWD) {
      targetPath = process.env.INIT_CWD;
    } else {
      targetPath = '.';
    }
  }

  const destDir = path.resolve(targetPath);

  printBanner();
  console.log(`${colors.dim}Target Workspace:${colors.reset} ${colors.bright}${destDir}${colors.reset}\n`);

  const ITEMS_TO_COPY = [
    '.agent-system',
    '.agents',
    '.claude',
    '.codex',
    '.cursor',
    '.gemini',
    '.github',
    '.opencode',
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    'OPENCODE.md',
    'opencode.json'
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
        const relPath = path.join(item, child);
        if (shouldCopyTemplate(relPath)) {
          filesToCopy.push(relPath);
        }
      }
    } else {
      if (shouldCopyTemplate(item)) {
        filesToCopy.push(item);
      }
    }
  }

  // Copy files
  for (const relPath of filesToCopy) {
    const srcFile = path.join(packageRoot, relPath);
    const destFile = path.join(destDir, relPath);
    const normalizedRelPath = normalizeRelPath(relPath);
    
    if (!fs.existsSync(destFile)) {
      // Create directories if necessary
      writeTemplateFile(normalizedRelPath, srcFile, destFile);
      console.log(`${colors.green}[CREATED]${colors.reset} ${relPath}`);
    } else {
      const srcBuf = fs.readFileSync(srcFile);
      const destBuf = fs.readFileSync(destFile);
      
      if (srcBuf.equals(destBuf)) {
        console.log(`${colors.cyan}${colors.dim}[IDENTICAL]${colors.reset} ${colors.dim}${relPath}${colors.reset}`);
      } else {
        if (MERGEABLE_JSON_FILES.has(normalizedRelPath)) {
          try {
            const changed = mergeJsonFile(srcFile, destFile);
            console.log(`${colors.yellow}${changed ? '[MERGED]' : '[IDENTICAL]'}${colors.reset} ${relPath}`);
            continue;
          } catch (err) {
            console.log(`${colors.yellow}[MERGE FAILED]${colors.reset} ${relPath}: ${err.message}`);
          }
        }

        if (MERGEABLE_MARKDOWN_FILES.has(normalizedRelPath)) {
          const changed = mergeMarkdownFile(normalizedRelPath, srcFile, destFile);
          if (changed !== null) {
            console.log(`${colors.yellow}${changed ? '[MERGED]' : '[IDENTICAL]'}${colors.reset} ${relPath}`);
            continue;
          }
        }

        const proposal = writeUpdateProposal(destDir, normalizedRelPath, srcFile);
        const status = proposal.changed ? '[PROPOSED]' : '[PROPOSAL IDENTICAL]';
        console.log(`${colors.yellow}${status}${colors.reset} ${relPath} -> ${proposal.relPath}`);
      }
    }
  }

  if (ensureProjectProfile(destDir)) {
    console.log(`${colors.green}[CREATED]${colors.reset} ${PROJECT_PROFILE_PATH}`);
  }

  if (!isGlobal) {
    // Update .gitignore
    console.log('');
    const gitignorePath = path.join(destDir, '.gitignore');
    const rulesToAppend = [
      '.agent-system/runs/',
      '.agent-system/tmp/',
      '.agent-system/updates/',
      '.claude/settings.local.json',
      '.gemini/settings.local.json',
      'opencode.local.json'
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
  }

  if (isGlobal) {
    console.log(`\n${colors.green}${colors.bright}✔ Agent system environment successfully initialized globally!${colors.reset}\n`);
    console.log(`${colors.bright}Next steps:${colors.reset}`);
    console.log(`  1. Review and update global configurations inside "${colors.cyan}~/.agent-system/project/profile.md${colors.reset}".`);
    console.log(`  2. Your custom agents and rules are now available system-wide in Claude Code and Codex.\n`);
  } else {
    console.log(`\n${colors.green}${colors.bright}✔ Agent system environment successfully initialized!${colors.reset}\n`);
    console.log(`${colors.bright}Next steps:${colors.reset}`);
    console.log(`  1. Review and update "${colors.cyan}.agent-system/project/profile.md${colors.reset}" to define your project purpose and commands.`);
    console.log(`  2. Standardize agent rules inside "${colors.cyan}.claude/${colors.reset}", "${colors.cyan}.agents/${colors.reset}", and "${colors.cyan}.codex/${colors.reset}" as needed.\n`);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  process.exit(1);
});
