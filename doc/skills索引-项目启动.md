# 项目启动 Skills 索引（对象：Codex 协作项目）

更新时间：2026-03-13

## 启动目标
- 在项目最开始阶段，先明确当前会话可用的 skills，后续按任务快速调用与复用。

## 检索结果
- 项目内 skills 目录：`.codex/skills`
  - `ui-ux-pro-max`
- 用户级 skills 目录：`C:/Users/AEboli/.codex/skills`
  - `.system`
  - `amazon-us-ops-analyst`
  - `doc`
  - `figma`
  - `figma-implement-design`
  - `find-skills`
  - `gh-fix-ci`
  - `openai-docs`
  - `pdf`
  - `playwright`
  - `prd-creater`
  - `security-best-practices`
  - `security-threat-model`
  - `sora`
  - `spreadsheet`
  - `winui-app`

## 常用技能快速映射（按场景）
- 前端视觉/页面重构：`ui-ux-pro-max`
- 真实浏览器自动化回归：`playwright`
- PRD 产出与模板匹配：`prd-creater`
- OpenAI API/产品官方文档检索：`openai-docs`
- Figma 到代码实现：`figma`、`figma-implement-design`
- 表格类文件处理：`spreadsheet`
- PDF/Word 文件处理：`pdf`、`doc`
- WinUI 桌面端开发：`winui-app`
- 亚马逊美国站运营分析：`amazon-us-ops-analyst`
- 安全评审与威胁建模：`security-best-practices`、`security-threat-model`

## 复用规则（执行约定）
- 用户明确点名 skill（如 `$playwright`）时，优先使用该 skill。
- 用户未点名但任务场景与 skill 描述匹配时，自动启用对应 skill。
- 每次任务开始先看本索引，再读取目标 skill 的 `SKILL.md` 关键流程，避免重复摸索。
