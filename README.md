# CC Start

```
  _____  _____         _____  _______   ___      _____  _______ 
  / ____|/ ____|       / ____||__   __| /   \    |  __ \|__   __|
 | |    | |           | (___     | |   /  ^  \   | |__) |  | |   
 | |    | |            \___ \    | |  /  /_\  \  |  _  /   | |   
 | |____| |____        ____) |   | | /  _____  \ | | \ \   | |   
  \_____|\_____|      |_____/    |_|/__/     \__\|_|  \_\  |_|   
                                    |__|     |__|                
```

**一条命令，终结 Claude Code 的上手门槛。多模型，一个工具就够了。**

---
![alt text](image.png)
## 为什么选择 CC Start？

Claude Code 默认只认 Anthropic 自家模型——想用国产大模型？环境变量、配置文件、每个窗口各自为战，稍不留神全面冲突。

CC Start 让你彻底告别这些折腾：

| | |
|---|---|
| 🚀 **一条命令装好一切** | 自动检测 & 安装 Node.js、Claude Code，脚本直达 PATH，安装即用，零手动 |
| 🧠 **Node.js 核心架构** | 启动逻辑统一由 Node.js 驱动，JSON 合并更稳，跨平台兼容更好 |
| 🎯 **多模型无缝切换** | `cc kimi` → `cc qwen` → `cc glm` — 一条命令换模型，比切歌还流畅 |
| 🪟 **多窗口独立运行** | 每个终端独立配置互不干扰，4 个窗口跑 4 个模型，随心所欲 |
| ➕ **任意模型随心加** | `cc add` 三步上手，兼容任何 Claude API 服务，不挑品牌不限数量 |
| 🌍 **全平台统一体验** | Windows / macOS / Linux 通吃，CMD、PowerShell、Bash 全支持 |

## 一分钟安装

```bash
git clone https://github.com/wandanan/cc_start.git && cd cc_start

# Windows → 双击运行
install.bat

# Mac / Linux → 终端执行
chmod +x install.sh && ./install.sh
```

安装脚本自动完成：

```
✅ 检测 & 自动安装 Node.js / Claude Code（缺失时）
✅ 复制启动脚本到系统 PATH
✅ 创建配置目录，预置模型配置模板
✅ 自动注册 cc 和 ccs 两个命令
✅ Windows 自动配置 PATH，无需手动操作
```

> 当前版本核心逻辑已迁移到 **Node.js**，不再依赖 Bash 4 关联数组。
> 只要 Node.js 可用（建议 18+），macOS/Linux/Windows 均可运行。

> **安装后提示命令找不到？** Windows 安装程序会自动添加 PATH，但如果失效请手动添加：
> `系统属性 → 环境变量 → 编辑用户 PATH → 新建 → %USERPROFILE%\.local\bin`

## 快速开始

安装完成后，先添加模型配置，然后就能用了：

```bash
# 添加模型配置
cc add

# 交互式选择模型启动
cc

# 或直接指定模型
cc kimi
cc qwen
```

```bash
$ cc

  _____  _____         _____  _______   ___      _____  _______
  / ____|/ ____|       / ____||__   __| /   \    |  __ \|__   __|
 | |    | |           | (___     | |   /  ^  \   | |__) |  | |
 | |    | |            \___ \    | |  /  /_\  \  |  _  /   | |
 | |____| |____        ____) |   | | /  _____  \ | | \ \   | |
  \_____|\_____|      |_____/    |_|/__/     \__\|_|  \_\  |_|
                                    |__|     |__|

  多模型，一个工具就够了

╔═══════════════════════════════════╗
║     请选择模型                    ║
╚═══════════════════════════════════╝

  1)  dsp4-flash     deepseek-v4-flash[1m]
  2)  dsp4-pro       deepseek-v4-pro[1m]
  3)  gpt-5.5        gpt-5.5
  4)  mimo-w         mimo-v2.5-pro
  5)  qewn3.6        qwen3.6-plus

  q)  退出        e)  编辑模型配置
  a)  添加新模型  r)  删除模型
  h)  查看帮助

  请输入编号或名称 (q=退出 a=添加 e=编辑 r=删除 h=帮助): 4
```

## 命令详解

| 命令 | 说明 |
|---|---|
| `cc` | 交互式选择模型启动（编号/名称直接启动） |
| `cc <模型名>` | 跳过菜单，直接启动指定模型 |
| `cc add` | 添加新模型配置（五步走：名称 → 模型 ID → Key → URL → 子代理） |
| `cc edit [模型名]` | 编辑已有模型配置（支持修改启动命令名称） |
| `cc remove [模型名]` | 删除模型配置 |
| `cc ls` | 列出所有已配置模型 |
| `cc sync [模型名]` | 将全局 `~/.claude/settings.json` 同步到模型文件，并保留该模型 API 字段 |
| `cc upgrade` | 扫描并升级 DeepSeek 配置（补齐 `[1m]` 与扩展字段） |
| `cc reset` | 清空所有模型配置 |
| `cc -h` | 查看帮助 |

> 在交互菜单中可直接输入 `e` 编辑模型、`r` 删除模型、`a` 添加新模型，无需记忆子命令。

> 💡 `cc` 和 `ccs` 完全等价。Linux 系统默认有 `/usr/bin/cc`（C 编译器），若需区分使用 `ccs` 即可。

## 支持的模型

预置 4 个国产大模型配置模板，填入 API Key 即刻启动：

| | 命令 | 模型 | 提供商 |
|---|---|---|---|
| 🔵 | `cc kimi` | Kimi K2.5 | Moonshot |
| 🟢 | `cc qwen` | 千问 3.5 Plus | Alibaba |
| 🟣 | `cc glm` | GLM 5 | Zhipu |
| 🟠 | `cc mini` | MiniMax M2.5 | MiniMax |
| ⚪ | `cc <自定义>` | 任意模型 | 任意兼容 Claude API 的服务 |

```bash
# 打开 4 个终端，各跑各的

终端 1 > cc kimi     # Kimi K2.5
终端 2 > cc qwen     # 千问 3.5 Plus
终端 3 > cc glm      # GLM 5
终端 4 > cc mini     # MiniMax M2.5
```

> 🔒 每个窗口独立配置，互不干扰，互不打架。

## 添加你自己的模型

`cc add` 支持添加任意兼容 Claude API 的模型，只需提供：

- **启动命令名称**（如 `deepseek`，之后用 `cc deepseek` 启动）
- **模型 ID**（如 `deepseek-v3`）
- **API Key**
- **Base URL**（API 端点地址）

```bash
cc add
# 按提示依次输入上述信息即可
```

配置文件保存在 `~/.claude/models/` 目录下，推荐格式如下：

```json
{
  "ANTHROPIC_AUTH_TOKEN": "your-api-key",
  "ANTHROPIC_BASE_URL": "https://api.example.com/anthropic",
  "ANTHROPIC_MODEL": "model-name",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "model-name",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "model-name",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "model-name",
  "CLAUDE_CODE_SUBAGENT_MODEL": "model-name",
  "skipWebFetchPreflight": true
}
```

## 工作原理

当前版本采用 **Node.js 核心 + 多平台薄包装入口**：

- `cc` / `ccs`（macOS/Linux）→ 调用 `node bin/cc-start.js`
- `cc.cmd` / `ccs.cmd`（Windows）→ 直接调用 `node bin\\cc-start.js`
- `cc.ps1` / `ccs.ps1`（PowerShell）→ 调用对应 `.cmd`

启动模型时，CC Start 会：

1. 读取全局 `~/.claude/settings.json`（若存在）
2. 用所选模型的 API 字段覆盖 `env`
3. 生成临时 settings 文件
4. 执行：

```bash
claude --settings <临时文件>
```

这样可保留全局 MCP/插件/hook 配置，同时按会话隔离模型凭据。

## 依赖

- [Claude Code](https://claude.ai/code) — 安装脚本会自动检测并在缺失时通过 npm 安装
- [Node.js](https://nodejs.org/) 18+

## License

MIT

---

<p align="center">
  <b>如果这个项目对你有帮助，点个 ⭐ Star 就是最大的鼓励！</b>
</p>

[![Star History Chart](https://api.star-history.com/svg?repos=wandanan/cc_start&type=Date)](https://star-history.com/#wandanan/cc_start&Date)
