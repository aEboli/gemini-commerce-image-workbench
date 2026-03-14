# 使用说明-OpenSpec与Context7

模块/功能对象：Codex 工作流增强接入（OpenSpec + Context7）

## 1. 这次安装了什么

- `OpenSpec CLI`：已全局安装 `@fission-ai/openspec@1.2.0`
- `Context7 MCP`：已在 Codex 全局配置中接入远程 `OAuth` 端点 `https://mcp.context7.com/mcp/oauth`
- 仓库内已补齐：
  - `openspec/changes/`
  - `openspec/specs/`
  - `.codex/skills/openspec-*`
  - `scripts/openspec.cmd`
- Codex 全局已补齐：
  - `C:\Users\AEboli\.codex\prompts\opsx-propose.md`
  - `C:\Users\AEboli\.codex\prompts\opsx-explore.md`
  - `C:\Users\AEboli\.codex\prompts\opsx-apply.md`
  - `C:\Users\AEboli\.codex\prompts\opsx-archive.md`
  - `C:\Users\AEboli\.codex\config.toml` 中的 `mcp_servers.context7`

## 2. 首次使用前

1. 重启 Codex。
2. 重启后重新打开当前工作区 `C:\Users\AEboli\Documents\Codex`。
3. 如果要确认 OpenSpec 已生效，可直接在仓库根目录执行：

```powershell
.\scripts\openspec.cmd list
```

正常情况下会看到 `No active changes found.` 或已有 change 列表。

## 3. 怎么用 OpenSpec

### 3.1 在 Codex 里用 slash commands

重启 Codex 后，可直接尝试：

- `/opsx:propose "想做的功能"`
- `/opsx:explore`
- `/opsx:apply`
- `/opsx:archive`

### 3.2 在终端里直接用 CLI

本机 PowerShell 对 npm 生成的 `openspec.ps1` 有执行策略限制，所以本仓库统一使用包装器：

```powershell
.\scripts\openspec.cmd list
.\scripts\openspec.cmd new change "add-something"
.\scripts\openspec.cmd status --change "add-something"
```

说明：

- `scripts/openspec.cmd` 会显式调用 `%APPDATA%\npm\openspec.cmd`
- 同时默认设置 `OPENSPEC_TELEMETRY=0`
- 这样可以避开 PowerShell 执行策略报错和遥测网络噪音

## 4. 怎么用 Context7

`Context7` 已作为 Codex 的远程 MCP 服务写入全局配置。重启 Codex 后，需要先完成一次 OAuth 认证，然后你可以在对话里直接要求：

- “用 Context7 查一下 React Router 最新文档”
- “用 Context7 看一下 Next.js App Router 的官方 API”
- “先走 Context7，再给我方案”

推荐流程：

1. 重启 Codex。
2. 当前这台机器已经完成过一次 `Context7` OAuth 授权；如果重启后 Codex 仍显示 `Context7` 未认证，再点击对应的 `Authenticate` / `Login`。
3. 如果你更习惯终端，也可以在本机执行：

```powershell
& "$env:APPDATA\npm\codex.cmd" mcp login context7
```

4. 在浏览器完成 Context7 OAuth 授权。

如果 Codex 成功加载并完成认证，它会在需要时调用 `Context7 MCP` 获取最新开发文档上下文。

当前这台机器还额外完成过一次真实冒烟测试：通过新启动的 `codex exec` 进程成功调用了 `context7.resolve-library-id`，返回结果包含 `LIBRARY_ID=/facebook/react`。

## 5. 可选增强

当前 `Context7` 已改为 `OAuth` 接入，优先使用账号授权，不再依赖本地 API Key 才能跑通。

如果你后续想改成 API Key 模式，我也可以再帮你切回 `stdio + CONTEXT7_API_KEY` 或 bearer token 方案。

## 6. 已知事项

- `Context7` 的新 MCP 配置只有在重启 Codex 后才会被加载。
- 当前 `Context7` 使用的是远程 OAuth 端点，所以最终能否使用，取决于“重启后是否完成登录授权”。
- 如果重启后 `OpenSpec` 或 `Context7` 没显示出来，直接继续找我，我会按当前这套配置做下一轮排障。
