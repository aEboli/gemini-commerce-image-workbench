# PRD-OpenSpec与Context7接入

模块/功能对象：Codex 工作流增强接入（OpenSpec + Context7）

## 1. 背景

当前工作区已经有持续开发需求，但缺少一套：

- 面向需求拆解和规范沉淀的 spec-driven 工作流
- 面向“查最新技术文档”的可调用上下文服务

因此需要在现有 Codex 环境中接入：

- `OpenSpec`：负责 change/spec/task 的结构化开发流程
- `Context7`：负责按需提供最新技术文档上下文

## 2. 目标

- 在当前仓库中落地 `OpenSpec` 的目录结构、技能与 Codex slash commands。
- 在当前 Codex 全局配置中接入 `Context7 MCP`。
- 解决 Windows PowerShell 下 npm 全局命令的执行兼容问题。
- 给后续协作者留下明确的使用说明与维护信息。

## 3. 非目标

- 本次不设计新的 OpenSpec 自定义 schema。
- 本次不引入 Context7 的团队级认证或权限治理。
- 本次不把仓库现有需求全部迁移为 OpenSpec change。

## 4. 用户故事

- 作为当前仓库的开发者，我希望直接用 `/opsx:*` 指令发起和推进变更，这样需求讨论、设计和实现能有统一结构。
- 作为需要查最新文档的开发者，我希望 Codex 能通过 `Context7` 获取最新技术资料，而不是只依赖离线知识。
- 作为 Windows 用户，我希望这些工具能在当前 PowerShell 环境下直接可用，而不是卡在执行策略或脚本兼容问题上。

## 5. 功能需求

### 5.1 OpenSpec 接入

- 必须全局安装 `OpenSpec CLI`。
- 必须在当前仓库生成 `openspec/changes/` 与 `openspec/specs/`。
- 必须在当前仓库生成 `openspec-propose`、`openspec-explore`、`openspec-apply-change`、`openspec-archive-change` 技能。
- 必须在 Codex 全局生成 `/opsx-*` prompt 文件。

### 5.2 Context7 接入

- 必须在 `C:\Users\AEboli\.codex\config.toml` 中新增 `mcp_servers.context7`。
- 默认采用远程 `OAuth` 接入方式，避免用户手工管理 API Key。
- 需要保留后续切换为 API Key / bearer token 模式的扩展空间。

### 5.3 Windows 兼容

- 必须规避 PowerShell 对 `openspec.ps1` 的执行策略限制。
- 必须保证仓库内 OpenSpec 技能文档中的命令可以直接在当前环境执行。
- 应尽量减少 OpenSpec 在当前受限网络环境中的遥测报错噪音。

### 5.4 交付与文档

- 必须补充对应使用说明。
- 必须补充对应 PRD。
- 必须在 `doc/进展记录.md` 记录本次变更与新增文档用途。

## 6. 验收标准

- `.\scripts\openspec.cmd list` 可在仓库根目录正常执行。
- `C:\Users\AEboli\.codex\prompts\` 下存在 4 个 `/opsx-*` prompt 文件。
- `C:\Users\AEboli\.codex\config.toml` 中存在 `mcp_servers.context7`。
- 重启 Codex 后，`OpenSpec` slash commands 可见，`Context7` 可被 Codex 作为 MCP 服务加载并可发起 OAuth 认证。
- `Readme/使用说明-OpenSpec与Context7.md` 与 `Readme/PRD-OpenSpec与Context7接入.md` 已落地。

## 7. 风险与假设

- `Context7` 采用远程 OAuth 模式后，最终仍需以重启 Codex 后的真实登录授权结果为准。
- 如果后续组织策略要求固定凭证而非交互登录，需要再切换到 API Key 或 bearer token 方案。
- OpenSpec 当前使用默认 profile，后续若团队流程需要更细的 schema，需要再做二次配置。
