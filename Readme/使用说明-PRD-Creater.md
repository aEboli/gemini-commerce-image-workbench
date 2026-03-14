# 使用说明-PRD-Creater

对应对象：`PRD-Creater` skill  
技能目录：`C:\Users\AEboli\.codex\skills\prd-creater`

## 1. 功能简介

`PRD-Creater` 用于把零散的产品信息整理为符合 Notion 官方 PRD 模板思路的结构化文档。当前版本不再只依赖单一通用模板，而是接入了从 Notion Marketplace `PRD` 搜索页同步下来的整套模板目录，用于先选型、再成文。

## 2. 适用场景

- 只有一个功能想法，希望快速生成第一版 PRD。
- 已有会议纪要或需求讨论，希望整理成正式文档。
- 想统一团队 PRD 结构，减少每次从零搭框架。
- 需要把中文需求整理成更接近 Notion 官方模板风格的文档。
- 需要从 Notion Marketplace 的大量 PRD 模板里做筛选、对比、短名单推荐。

## 3. 当前接入范围

基于 `2026-03-13` 的同步快照，当前已接入：

- `98` 个 Notion Marketplace `PRD` 搜索结果
- 其中 `68` 个免费模板
- `30` 个付费模板
- `6` 个 Notion 官方模板

对应文件：

- `C:\Users\AEboli\.codex\skills\prd-creater\references\notion-prd-marketplace-catalog.md`
- `C:\Users\AEboli\.codex\skills\prd-creater\references\notion-prd-marketplace-catalog.json`

## 4. 触发方式

推荐两种方式：

1. 显式触发：在提示词中直接写 `$prd-creater`。
2. 自然语言触发：明确提出“生成 PRD”“按 Notion PRD 模板整理”“把这段需求写成 PRD”等需求。

示例：

- `用 $prd-creater 把这段需求讨论整理成正式 PRD。`
- `根据这份会议纪要，输出一版适合粘贴到 Notion 的 PRD。`
- `Use $prd-creater to write an English PRD with goals, KPIs, scope, and release criteria.`

## 5. 建议输入

为了让输出更稳定，建议尽量提供以下信息中的一部分：

- 功能或项目名称
- 目标用户
- 现在存在的问题
- 预期目标或业务价值
- 本次范围
- 已知约束、依赖、风险
- 希望上线的时间点
- 相关设计稿、研究结论或历史文档链接

如果信息不完整，skill 会尽量补出最小可用版本，并把不确定内容标记为 `待确认`。

## 6. 使用逻辑

默认分两步：

1. 先从同步后的 Notion 模板目录里选最接近的模板家族。
2. 再结合 Notion 官方 PRD 骨架，生成适合当前需求的 PRD。

如果用户明确说“用官方模板”“只看免费模板”“按 Internal Tool PRD 那种风格写”，skill 会优先按目录元数据筛选。

## 7. 标准输出结构

默认会按下面的顺序组织内容：

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

当任务更偏实验、跨团队协作或高不确定性时，还会补充：

- Hypothesis
- Related work
- Design and interaction
- Qualitative feedback

## 8. 资源文件说明

- `SKILL.md`：skill 的触发规则、工作流和输出规范。
- `references/notion-official-prd-template.md`：Notion 官方 PRD 模板和相关文章的提炼版本。
- `references/notion-prd-marketplace-catalog.md`：98 条模板的人读索引。
- `references/notion-prd-marketplace-catalog.json`：98 条模板的结构化目录，含描述、类别、链接、抓取出的正文文本。
- `references/notion-prd-marketplace-selection-guide.md`：模板家族选型规则。
- `assets/notion-prd-template.md`：可直接复用的 PRD Markdown 模板。
- `scripts/sync_notion_marketplace_catalog.py`：重新同步 Notion Marketplace `PRD` 搜索结果的脚本。
- `agents/openai.yaml`：UI 展示名、简要描述和默认提示词。

## 9. 维护建议

- 如果 Notion Marketplace 模板数量、价格或链接变化，优先运行：

```bash
python C:\Users\AEboli\.codex\skills\prd-creater\scripts\sync_notion_marketplace_catalog.py --query PRD
```

- 如果 Notion 官方 PRD 模板结构发生明显变化，优先更新 `references/notion-official-prd-template.md`。
- 如果团队内部想固定更多字段，比如 `Owner`、`Priority`、`Launch plan`，优先更新 `assets/notion-prd-template.md`。
- 如果希望增强触发准确度或默认文案，更新 `SKILL.md` 与 `agents/openai.yaml`，并重新执行校验。
