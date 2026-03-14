# PRD-PRD-Creater

对应对象：`PRD-Creater` skill  
技能目录：`C:\Users\AEboli\.codex\skills\prd-creater`

## 1. 背景

当前会话中的 skill 体系已经覆盖文档、表格、Figma、Playwright、WinUI 等方向，但缺少一个专门面向“需求文档标准化输出”的 skill。用户希望基于 Notion 官方 PRD 模板思路，新增一个可以稳定生成 PRD 的技能，用于把零散输入转成结构化产品需求文档。随后又进一步要求不要只接一个通用模板，而是把 Notion Marketplace 中 `PRD` 搜索结果里的整套模板目录完整接入。

## 2. 目标

创建一个名为 `PRD-Creater` 的 skill，并满足以下目标：

- 能根据 Notion 官方 PRD 模板的稳定骨架生成 PRD。
- 能接入并复用 Notion Marketplace `PRD` 搜索结果中的全部模板目录信息。
- 能处理功能想法、会议纪要、路线图条目、研究摘要等不同来源输入。
- 能在信息不足时做最小合理补全，并明确标记 `待确认`。
- 能输出适合直接粘贴到 Notion 的 Markdown 结构。
- 能为后续维护者提供清晰的使用说明与设计文档。

## 3. 目标用户

- 使用 Codex 生成 PRD 的产品经理、项目经理、需求分析师。
- 需要快速形成需求文档初稿的研发、设计或运营协作者。
- 需要统一 PRD 输出格式的团队维护者。

## 4. 核心能力

- 从原始输入中提取 `Context`、`Goals and KPIs`、`Scope`、`Requirements`、`Dependencies` 等关键信息。
- 参考 Notion 官方 PRD 资料，输出更稳定的章节顺序和内容粒度。
- 从 Notion Marketplace `PRD` 搜索页同步模板目录，支持模板筛选、模板对比和最佳匹配。
- 在复杂场景下补充 `Hypothesis`、`Related work`、`Design and interaction`、`Guardrail metrics` 等扩展上下文。
- 提供一份可重复使用的 Markdown 模板，降低每次从零起草的成本。
- 提供可重跑的同步脚本，而不是一次性手工维护目录。

## 5. 非目标

- 不负责把 PRD 自动同步到真实 Notion 页面。
- 不负责替代详细技术设计文档或开发方案设计。
- 不负责项目管理数据库、任务分派系统或甘特图自动生成。

## 6. 输入

典型输入包括但不限于：

- 一段功能描述
- 一条 roadmap item
- 一份会议纪要
- 一份用户研究摘要
- 多段聊天记录或需求讨论

可选增强输入：

- 目标用户画像
- KPI 或业务目标
- 设计稿链接
- 依赖团队和计划上线时间

## 7. 输出

默认输出为一份可直接粘贴进 Notion 的 Markdown PRD，通常包含：

- 一句话概述
- 背景
- 目标用户与核心问题
- 目标与 KPI
- 范围
- 需求与功能
- 约束与假设
- 依赖
- 发布标准
- 指标与护栏
- 任务拆解
- 相关资料
- 风险与开放问题

此外，skill 会额外维护一份 Notion Marketplace `PRD` 模板目录快照，用于模板检索与选型。

## 8. 交付物

- `C:\Users\AEboli\.codex\skills\prd-creater\SKILL.md`
- `C:\Users\AEboli\.codex\skills\prd-creater\scripts\sync_notion_marketplace_catalog.py`
- `C:\Users\AEboli\.codex\skills\prd-creater\references\notion-official-prd-template.md`
- `C:\Users\AEboli\.codex\skills\prd-creater\references\notion-prd-marketplace-catalog.md`
- `C:\Users\AEboli\.codex\skills\prd-creater\references\notion-prd-marketplace-catalog.json`
- `C:\Users\AEboli\.codex\skills\prd-creater\references\notion-prd-marketplace-selection-guide.md`
- `C:\Users\AEboli\.codex\skills\prd-creater\assets\notion-prd-template.md`
- `C:\Users\AEboli\.codex\skills\prd-creater\agents\openai.yaml`
- `Readme/使用说明-PRD-Creater.md`
- `Readme/PRD-PRD-Creater.md`

## 9. 验收标准

- skill 名称规范化为 `prd-creater`，并可被 `quick_validate.py` 校验通过。
- `SKILL.md` 的 frontmatter 只包含 `name` 和 `description`。
- skill 描述中明确写清使用场景和触发条件。
- 至少包含一份官方结构参考文件和一份可复用模板文件。
- 至少包含一份可重跑的 Marketplace 同步脚本和一份完整模板目录快照。
- `Readme/` 下补齐对应使用说明和 PRD 文档。
- `doc/进展记录.md` 中记录本次新增文件及用途。

## 10. 风险与约束

- Notion Marketplace 搜索页更偏模板分发入口，稳定可引用的信息主要来自 Notion 官方帮助中心和博客，因此 skill 采用“官方稳定结构 + 可维护抽象”的方式落地。
- Marketplace 搜索结果是时间敏感数据，`98` 只是本次同步快照，不保证长期不变。
- 用户指定名称为 `PRD-Creater`，但按 skill 规范实际目录名必须使用 `prd-creater`。
- Notion 官方 PRD 模板会持续演进，后续可能需要更新参考文件和模板骨架。
