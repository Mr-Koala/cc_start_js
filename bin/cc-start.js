#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const readline = require('readline');

const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, '.claude', 'models');
const USER_SETTINGS = path.join(HOME, '.claude', 'settings.json');

const KNOWN_ENV_KEYS = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
  'CLAUDE_CODE_EFFORT_LEVEL',
  'CLAUDE_CODE_AUTO_COMPACT_WINDOW',
];

function ensureDirs() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function listModels() {
  ensureDirs();
  return fs.readdirSync(CONFIG_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const name = path.basename(f, '.json');
      const full = path.join(CONFIG_DIR, f);
      const json = readJson(full) || {};
      const desc = json.ANTHROPIC_MODEL || name;
      return { name, desc, file: full, json };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function showBanner() {
  console.log(String.raw`
  _____  _____         _____  _______   ___      _____  _______
 / ____|/ ____|       / ____||__   __| /   \    |  __ \|__   __|
| |    | |           | (___     | |   /  ^  \   | |__) |  | |
| |    | |            \___ \    | |  /  /_\  \  |  _  /   | |
| |____| |____        ____) |   | | /  _____  \ | | \ \   | |
 \_____|\_____|      |_____/    |_|/__/     \__\|_|  \_\  |_|
                                  |__|     |__|
`);
  console.log('  多模型，一个工具就够了\n');
}

function help() {
  console.log(`CC Start (Node.js core)\n\nUsage:\n  ccs                Interactive model selector\n  ccs <model>        Launch Claude Code with model config\n  ccs add            Add model config\n  ccs edit [model]   Edit model config\n  ccs remove [model] Remove model config\n  ccs ls             List model configs\n  ccs sync [model]   Sync global settings into model file (keep model env)\n  ccs upgrade        Upgrade DeepSeek configs (fill missing defaults)\n  ccs reset          Delete all model configs\n  ccs -h             Show help\n`);
}

function printModels() {
  const models = listModels();
  if (!models.length) {
    console.log('No models found. Use: cc add');
    return;
  }
  console.log('\nConfigured models:\n');
  for (const m of models) {
    console.log(`  ${m.name.padEnd(16)} ${m.desc}`);
  }
  console.log('');
}

function rlq() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, a => resolve(a.trim())));
  const close = () => rl.close();
  return { ask, close };
}

function defaultsFromModel(model) {
  const envSrc = model.env && typeof model.env === 'object' ? model.env : {};
  const modelId = model.ANTHROPIC_MODEL || envSrc.ANTHROPIC_MODEL || model.model || '';
  return {
    ANTHROPIC_AUTH_TOKEN: model.ANTHROPIC_AUTH_TOKEN || envSrc.ANTHROPIC_AUTH_TOKEN || '',
    ANTHROPIC_BASE_URL: model.ANTHROPIC_BASE_URL || envSrc.ANTHROPIC_BASE_URL || '',
    ANTHROPIC_MODEL: modelId,
    ANTHROPIC_DEFAULT_OPUS_MODEL: model.ANTHROPIC_DEFAULT_OPUS_MODEL || envSrc.ANTHROPIC_DEFAULT_OPUS_MODEL || modelId,
    ANTHROPIC_DEFAULT_SONNET_MODEL: model.ANTHROPIC_DEFAULT_SONNET_MODEL || envSrc.ANTHROPIC_DEFAULT_SONNET_MODEL || modelId,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: model.ANTHROPIC_DEFAULT_HAIKU_MODEL || envSrc.ANTHROPIC_DEFAULT_HAIKU_MODEL || modelId,
    CLAUDE_CODE_SUBAGENT_MODEL: model.CLAUDE_CODE_SUBAGENT_MODEL || envSrc.CLAUDE_CODE_SUBAGENT_MODEL || modelId,
    CLAUDE_CODE_EFFORT_LEVEL: model.CLAUDE_CODE_EFFORT_LEVEL || envSrc.CLAUDE_CODE_EFFORT_LEVEL || '',
    CLAUDE_CODE_AUTO_COMPACT_WINDOW: model.CLAUDE_CODE_AUTO_COMPACT_WINDOW || envSrc.CLAUDE_CODE_AUTO_COMPACT_WINDOW || '',
  };
}

function mergedSettings(model) {
  const base = fs.existsSync(USER_SETTINGS) ? (readJson(USER_SETTINGS) || {}) : {};
  const env = defaultsFromModel(model);
  const out = { ...base, env: {} };
  for (const key of Object.keys(env)) {
    if (env[key] !== '') out.env[key] = env[key];
  }
  if (model.skipWebFetchPreflight === true) {
    out.skipWebFetchPreflight = true;
  }
  return out;
}

function launch(modelName) {
  const file = path.join(CONFIG_DIR, `${modelName}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Model not found: ${modelName}`);
    process.exit(1);
  }
  const model = readJson(file);
  if (!model) {
    console.error(`Invalid JSON: ${file}`);
    process.exit(1);
  }

  const settings = mergedSettings(model);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-start-'));
  const tmpSettings = path.join(tmpDir, 'settings.json');
  writeJson(tmpSettings, settings);

  const env = { ...process.env };
  const eff = defaultsFromModel(model);
  for (const key of KNOWN_ENV_KEYS) {
    if (eff[key]) env[key] = eff[key];
  }

  const child = spawn('claude', ['--settings', tmpSettings], {
    stdio: 'inherit',
    env,
  });

  child.on('exit', (code, signal) => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}

async function cmdAdd() {
  ensureDirs();
  const q = rlq();
  try {
    const alias = await q.ask('Alias (e.g. qwen): ');
    if (!alias) return;
    const file = path.join(CONFIG_DIR, `${alias}.json`);
    if (fs.existsSync(file)) {
      const c = await q.ask('Exists. Overwrite? (y/N): ');
      if (!/^y(es)?$/i.test(c)) return;
    }

    const model = (await q.ask('Model ID: ')) || alias;
    const key = await q.ask('API Key: ');
    const baseUrl = await q.ask('Base URL: ');
    const subagent = (await q.ask('Subagent model (optional): ')) || model;

    const obj = {
      ANTHROPIC_AUTH_TOKEN: key,
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_MODEL: model,
      ANTHROPIC_DEFAULT_OPUS_MODEL: model,
      ANTHROPIC_DEFAULT_SONNET_MODEL: model,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: subagent,
      CLAUDE_CODE_SUBAGENT_MODEL: subagent,
      skipWebFetchPreflight: true,
    };

    if (isDeepSeek(baseUrl)) {
      obj.ANTHROPIC_MODEL = model.endsWith('[1m]') ? model : `${model}[1m]`;
      obj.ANTHROPIC_DEFAULT_OPUS_MODEL = obj.ANTHROPIC_MODEL;
      obj.ANTHROPIC_DEFAULT_SONNET_MODEL = obj.ANTHROPIC_MODEL;
      obj.ANTHROPIC_DEFAULT_HAIKU_MODEL = obj.ANTHROPIC_MODEL;
      obj.CLAUDE_CODE_SUBAGENT_MODEL = obj.ANTHROPIC_MODEL;
      obj.CLAUDE_CODE_EFFORT_LEVEL = 'max';
      obj.CLAUDE_CODE_AUTO_COMPACT_WINDOW = '400000';
    }

    writeJson(file, obj);
    console.log(`Saved: ${file}`);
  } finally {
    q.close();
  }
}

async function pickModelOrArg(arg) {
  const models = listModels();
  if (!models.length) return null;
  if (arg) {
    const hit = models.find(m => m.name === arg);
    return hit ? hit.name : null;
  }
  const q = rlq();
  try {
    console.log('\nSelect model:\n');
    models.forEach((m, i) => console.log(`  ${i + 1}) ${m.name.padEnd(14)} ${m.desc}`));
    console.log('\n  q) quit\n');
    const a = await q.ask('Choice: ');
    if (/^q$/i.test(a)) return null;
    if (/^\d+$/.test(a)) {
      const i = Number(a) - 1;
      if (i >= 0 && i < models.length) return models[i].name;
    }
    if (models.some(m => m.name === a)) return a;
    return null;
  } finally {
    q.close();
  }
}

async function cmdEdit(nameArg) {
  const name = await pickModelOrArg(nameArg);
  if (!name) return;
  const file = path.join(CONFIG_DIR, `${name}.json`);
  const old = readJson(file) || {};
  const q = rlq();
  try {
    const askDef = async (label, def) => {
      const v = await q.ask(`${label} [${def ?? ''}]: `);
      return v || def || '';
    };
    const model = await askDef('Model ID', old.ANTHROPIC_MODEL || name);
    const key = await askDef('API Key', old.ANTHROPIC_AUTH_TOKEN || '');
    const baseUrl = await askDef('Base URL', old.ANTHROPIC_BASE_URL || '');
    const subagent = await askDef('Subagent model', old.CLAUDE_CODE_SUBAGENT_MODEL || model);

    const obj = {
      ...old,
      ANTHROPIC_AUTH_TOKEN: key,
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_MODEL: model,
      ANTHROPIC_DEFAULT_OPUS_MODEL: old.ANTHROPIC_DEFAULT_OPUS_MODEL || model,
      ANTHROPIC_DEFAULT_SONNET_MODEL: old.ANTHROPIC_DEFAULT_SONNET_MODEL || model,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: old.ANTHROPIC_DEFAULT_HAIKU_MODEL || subagent,
      CLAUDE_CODE_SUBAGENT_MODEL: subagent,
    };

    writeJson(file, obj);
    console.log(`Updated: ${file}`);
  } finally {
    q.close();
  }
}

async function cmdRemove(nameArg) {
  const name = await pickModelOrArg(nameArg);
  if (!name) return;
  const file = path.join(CONFIG_DIR, `${name}.json`);
  const q = rlq();
  try {
    const c = await q.ask(`Delete ${name}? (y/N): `);
    if (!/^y(es)?$/i.test(c)) return;
    fs.rmSync(file, { force: true });
    console.log(`Deleted: ${file}`);
  } finally {
    q.close();
  }
}

function isDeepSeek(baseUrl) {
  return String(baseUrl || '').toLowerCase().includes('deepseek');
}

function ensure1m(modelId) {
  if (!modelId) return modelId;
  return modelId.endsWith('[1m]') ? modelId : `${modelId}[1m]`;
}

async function cmdSync(nameArg) {
  if (!fs.existsSync(USER_SETTINGS)) {
    console.error(`Global settings not found: ${USER_SETTINGS}`);
    process.exit(1);
  }

  const name = await pickModelOrArg(nameArg);
  if (!name) return;

  const file = path.join(CONFIG_DIR, `${name}.json`);
  const model = readJson(file);
  const global = readJson(USER_SETTINGS);
  if (!model || !global || typeof global !== 'object') {
    console.error('Invalid model/global settings JSON.');
    process.exit(1);
  }

  const env = defaultsFromModel(model);
  const merged = { ...global };
  merged.env = {};
  for (const key of Object.keys(env)) {
    if (env[key] !== '') merged.env[key] = env[key];
  }

  // Keep flat compatibility keys in model config file
  for (const key of KNOWN_ENV_KEYS) {
    if (env[key] !== '') merged[key] = env[key];
  }

  if (model.skipWebFetchPreflight === true || global.skipWebFetchPreflight === true) {
    merged.skipWebFetchPreflight = true;
  }

  writeJson(file, merged);
  console.log(`Synced: ${file}`);
}

async function cmdUpgrade() {
  const models = listModels();
  let upgraded = 0;

  for (const m of models) {
    const obj = readJson(m.file);
    if (!obj) continue;

    const env = defaultsFromModel(obj);
    if (!isDeepSeek(env.ANTHROPIC_BASE_URL)) continue;

    let changed = false;
    const fixedModel = ensure1m(env.ANTHROPIC_MODEL);
    if (fixedModel && fixedModel !== env.ANTHROPIC_MODEL) changed = true;

    const next = { ...obj };
    next.ANTHROPIC_MODEL = fixedModel;
    if (!next.ANTHROPIC_DEFAULT_OPUS_MODEL) { next.ANTHROPIC_DEFAULT_OPUS_MODEL = fixedModel; changed = true; }
    if (!next.ANTHROPIC_DEFAULT_SONNET_MODEL) { next.ANTHROPIC_DEFAULT_SONNET_MODEL = fixedModel; changed = true; }
    if (!next.ANTHROPIC_DEFAULT_HAIKU_MODEL) { next.ANTHROPIC_DEFAULT_HAIKU_MODEL = fixedModel; changed = true; }
    if (!next.CLAUDE_CODE_SUBAGENT_MODEL) { next.CLAUDE_CODE_SUBAGENT_MODEL = fixedModel; changed = true; }
    if (!next.CLAUDE_CODE_EFFORT_LEVEL) { next.CLAUDE_CODE_EFFORT_LEVEL = 'max'; changed = true; }
    if (!next.CLAUDE_CODE_AUTO_COMPACT_WINDOW) { next.CLAUDE_CODE_AUTO_COMPACT_WINDOW = '400000'; changed = true; }

    // keep env block aligned if present
    if (next.env && typeof next.env === 'object') {
      next.env.ANTHROPIC_MODEL = next.ANTHROPIC_MODEL;
      next.env.ANTHROPIC_DEFAULT_OPUS_MODEL = next.ANTHROPIC_DEFAULT_OPUS_MODEL;
      next.env.ANTHROPIC_DEFAULT_SONNET_MODEL = next.ANTHROPIC_DEFAULT_SONNET_MODEL;
      next.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = next.ANTHROPIC_DEFAULT_HAIKU_MODEL;
      next.env.CLAUDE_CODE_SUBAGENT_MODEL = next.CLAUDE_CODE_SUBAGENT_MODEL;
      next.env.CLAUDE_CODE_EFFORT_LEVEL = next.CLAUDE_CODE_EFFORT_LEVEL;
      next.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW = next.CLAUDE_CODE_AUTO_COMPACT_WINDOW;
    }

    if (changed) {
      writeJson(m.file, next);
      upgraded += 1;
      console.log(`Upgraded: ${m.name}`);
    }
  }

  if (upgraded === 0) console.log('All DeepSeek configs are already up to date.');
  else console.log(`Done. Upgraded ${upgraded} config(s).`);
}

async function cmdReset() {
  ensureDirs();
  const q = rlq();
  try {
    const c = await q.ask('Type RESET to delete all model configs: ');
    if (c !== 'RESET') return;
    for (const f of fs.readdirSync(CONFIG_DIR)) {
      if (f.endsWith('.json')) fs.rmSync(path.join(CONFIG_DIR, f), { force: true });
    }
    console.log('All model configs removed.');
  } finally {
    q.close();
  }
}

async function interactive() {
  showBanner();
  const models = listModels();
  if (!models.length) {
    console.log('No models found. Use: ccs add');
    return;
  }
  const selected = await pickModelOrArg();
  if (selected) launch(selected);
}

async function main() {
  ensureDirs();
  const [cmd, arg] = process.argv.slice(2);

  if (!cmd) return interactive();
  if (cmd === '-h' || cmd === '--help' || cmd === 'help') return help();
  if (cmd === 'ls' || cmd === 'list') return printModels();
  if (cmd === 'add') return cmdAdd();
  if (cmd === 'edit') return cmdEdit(arg);
  if (cmd === 'remove' || cmd === 'rm' || cmd === 'delete') return cmdRemove(arg);
  if (cmd === 'sync') return cmdSync(arg);
  if (cmd === 'upgrade') return cmdUpgrade();
  if (cmd === 'reset') return cmdReset();

  return launch(cmd);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
