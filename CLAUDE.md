# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

CC Start is a multi-model launcher for Claude Code. It lets users switch between LLM providers (Kimi, Qwen, GLM, MiniMax, DeepSeek, custom) per terminal window via `cc <model>`. The core is a Node.js script (`bin/cc-start.js`) that manages per-model config files and merges them with the user's global Claude Code settings at launch time. Shell wrappers (`cc`, `cc.cmd`, `cc.ps1`) delegate to the Node.js entry point.

## File roles

| File | Purpose |
|------|---------|
| `cc` / `ccs` | Identical bash wrappers — check for Node.js, then `exec node bin/cc-start.js "$@"` |
| `bin/cc-start.js` | **Core logic** — all model management, config merge, CLI dispatch (~410 lines) |
| `cc.cmd` / `ccs.cmd` | Windows CMD wrappers — directly invoke `node bin\cc-start.js %*` |
| `cc.ps1` / `ccs.ps1` | PowerShell wrappers — call corresponding `.cmd` files |
| `install.bat` | Windows installer — copies scripts to `%USERPROFILE%\.local\bin`, updates PATH, seeds model configs |
| `install.sh` | macOS/Linux installer — copies `cc`/`ccs` and `bin/cc-start.js` to `~/.local/bin`, symlinks, seeds model configs |
| `init.ps1` | Session-only PowerShell init — registers `cc`/`ccs` as PowerShell functions without global install |

## Architecture

### How launch works (the critical path)

1. **Shell entry**: `cc`/`ccs`/`cc.cmd`/`cc.ps1` → delegates to `node bin/cc-start.js`
2. **Config scan**: `listModels()` reads `~/.claude/models/*.json` into an array
3. **Command dispatch**: `main()` parses `process.argv[2]` for subcommands (`add`, `edit`, `remove`, `ls`, `sync`, `upgrade`, `reset`, `-h`) or treats the argument as a model name to launch
4. **Settings merge** (`mergedSettings`): Reads `~/.claude/settings.json`, spreads it, replaces the `env` block with the selected model's API credentials. This avoids model A's credentials leaking into model B's session
5. **Environment export**: All known env vars (`ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, etc.) are set on the child process env
6. **CLI invocation**: `spawn('claude', ['--settings', tmpSettings])` with `stdio: 'inherit'`

### Per-model config format (`~/.claude/models/<name>.json`)

```json
{
  "ANTHROPIC_AUTH_TOKEN": "...",
  "ANTHROPIC_BASE_URL": "https://api.example.com/anthropic",
  "ANTHROPIC_MODEL": "model-id",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "model-id",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "model-id",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "subagent-model-id",
  "CLAUDE_CODE_SUBAGENT_MODEL": "subagent-model-id",
  "skipWebFetchPreflight": true
}
```

DeepSeek configs additionally include `CLAUDE_CODE_EFFORT_LEVEL` and `CLAUDE_CODE_AUTO_COMPACT_WINDOW`.

### DeepSeek special handling

DeepSeek API URLs (containing "deepseek") trigger automatic configuration:
- Model IDs get `[1m]` suffix appended for the 1M-token context window
- Default env fields (effort level=max, compact window=400000) are written
- `cmdUpgrade()` scans and upgrades stale DeepSeek configs

### Key functions in `bin/cc-start.js`

| Function | Purpose |
|----------|---------|
| `main()` | CLI dispatch — routes to subcommands or model launch |
| `interactive()` | Shows banner + model picker when no args |
| `launch(modelName)` | Reads config, creates temp settings, spawns `claude` |
| `mergedSettings(model)` | Merges global settings with model env (credential isolation) |
| `defaultsFromModel(model)` | Extracts env values with fallbacks |
| `listModels()` | Scans `~/.claude/models/*.json` |
| `cmdAdd()` | Interactive wizard to create model config |
| `cmdEdit()` | Edit existing model config |
| `cmdRemove()` | Delete model config |
| `cmdSync()` | Sync global settings into model file |
| `cmdUpgrade()` | Upgrade DeepSeek configs with missing defaults |
| `cmdReset()` | Delete all model configs (requires typing RESET) |

### Platform compatibility

- Requires **Node.js 18+** (no Bash 4 dependency)
- Shell wrappers handle PATH/entry point differences
- `install.sh` auto-detects and installs Node.js via nvm if missing
- `install.bat` handles Windows PATH setup
- `cc` and `ccs` are identical files (Linux avoids name collision with `/usr/bin/cc`)

## Constraints

- **No external npm dependencies** — `bin/cc-start.js` uses only Node.js built-ins (`fs`, `path`, `os`, `child_process`, `readline`)
- **`cc` and `ccs` must stay identical** — they're the same file deployed under two names
- **`.gitignore` excludes all `.json` files** except `example-*.json` — model config templates must follow that naming pattern
- **LF line endings are enforced** via `.gitattributes` for `*.sh`, `cc`, and `ccs`
