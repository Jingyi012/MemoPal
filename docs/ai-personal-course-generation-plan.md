# 自建课程：AI 补全意思与自动出题实施计划

日期：2026-11-15；2026-11-16 更新。状态：已由 Luna 实施，主代理完成代码、自动检查及 Expo Web 手机宽度主要流程验收。实际能力和原生设备等验证限制见[使用说明](ai-personal-course-generation.md)及[验收记录](ai-personal-course-generation-acceptance.md)。

## 1. 产品目标与边界

家长、学生只需输入、粘贴或扫描资料并安排单元，即可获得私人学习卡片及可作答的单元练习。默认推荐 AI 辅助；不要求用户编题、配置答案和干扰项。学习为主，记忆法继续作为可选辅助。

覆盖中文、英语、马来语词语、短句和已有解释的知识点，适用于儿童到中学生。课程内容语言和意思语言分开：内容语言沿用已有选择；意思语言默认界面语言，可改为中文/English/Bahasa Melayu。年龄/难度不猜测具体年龄，默认基础，进阶可选。

不承诺所有资料都能生成所有题型。不将文字答案或朗读按钮伪装成真正语音评分。首版复用现有可自动判分题型；朗读使用现有 TTS；口语、手写准确识别必须有可靠实现才启用。原始资料和用户已有意思绝不被 AI 自动覆盖。

## 2. 当前代码事实与复用位置

- `CreateStudyCourseDraft.cs` 已生成私人课程、单元、词汇/知识点/短句学习卡片及可选 assessment。AI 采用检查内容快照和选中题目，并将题目经现有 seed factory 持久化。
- `EducationPersonalCourseScreen.tsx` 已能进入现有 guided session；复用练习播放器、反馈、进度和结果页，不新增平行答题引擎。
- `LearningDraftUnits.tsx` 已展示意思输入和导入预览；`educationStudyList.ts` 已支持明确分隔的词语/意思。继续完善这个确认流程。
- AI 已有 Admin 配置、Gemini/Ollama/OpenRouter 文本 provider、`IAiCredits` 预留/结算/释放、requestId 指纹、结果恢复机制。必须复用，不能建第二个钱包、绕过费用或将模板结果冒充 AI。
- 现有 textCost、provider enabled/configured 状态是费用与可用性来源。新增设置只有确有需要才加，并在 Admin 提供真实配置入口。

## 3. 完整用户流程

### 3.1 基本信息及导入

保留三步结构：基本信息 → 确认内容 → 预览并开始。基本信息选择名称、内容语言；高级选项收起，包含内容类型（词语、知识点、短句）、意思语言和基础/进阶。输入/粘贴/扫描共用条目和说明字段。

扫描不应猜测任意空格左右是词语和释义。明确两列或分隔可解析，其他内容保留待确认。导入失败、重复、超长、超过总量限制就地解释并保留输入。避免弹窗层层叠加。

### 3.2 AI 准备入口与费用

在确认内容页提供一张紧凑的「自动准备学习和练习」卡片：显示缺少意思数量、预期能力、AI credits 最高费用；开关默认推荐开启。含义已有的条目仍可用于出题，不能再次被补全覆盖。

主按钮为「准备并预览」；提供「先保存内容」低层级操作。用户对这个按钮的明确操作构成该次费用确认；发送 server estimate/price snapshot 和 maxCredits。不在静默 effect 或进入页面时扣点。余额不足显示需要/当前数量，可关闭 AI 继续，不强制付费页面。

首次使用说明：将当前词语及必要课程上下文发送至已配置 AI 服务，用于补意思和题目；生成结果可能需要检查。说明紧凑、可展开，不重复占满屏。RestrictedLearner 沿用服务器授权限制，不新增儿童付费捷径。

### 3.3 生成中及恢复

生成按钮显示真实的「正在补全意思并准备练习…」，不编造百分比或未从服务器取得的子步骤。输入快照、requestId 和 generationId 用于断线恢复；具体 requestId 可查询，等待中避免重复提交。离开页面会按账号保留本地恢复线索；再次进入会查询同一服务器任务和结果。不可将 HTTP 断线直接判为生成失败后重新计费。

资料先安全保留；生成结果在预览采用后保存为课程，避免半生成课程处于可学习状态。可以采用复用的持久 AiGeneration 结果作为待采用草稿，无需另建本地数据库。若采用同步生成，必须复用现有可恢复服务器执行机制，具有有限超时和状态查询。

### 3.4 预览和修正

按单元显示卡片数、可用练习数/题型；意思条目显示「你提供的」或「AI 建议」。用户可编辑或移除建议；不会强制逐条点击确认。AI 不确定或多义且缺上下文的条目单独标记「需要确认」，不能编造确定答案。练习按单元折叠，预览提供选项/配对和正确答案、解释，并显示实际扣费及没有意思或练习的条目数量。

默认展开需要确认项，其余内容可折叠；预览每种题型的示例及答案/解释，用户可删除不合适题目。用户编辑词语/意思后，关联生成题目必须失效或重新生成，禁止保存不匹配的旧答案。重新生成是显式动作并重新估价；不重复收取已完成的请求费用。

主按钮「保存并开始学习」。显示私人范围。用户资料缺意思仍可保存；空题库不能显示一个无法点击的开始测验入口，解释未准备练习并提供准备入口。

### 3.5 学习、练习、复习

课程详情复用预设课程 hero、单元路径、学习/练习入口和进度。学习卡片结束 → 练习准备 → 单元练习 → 结果/错题再练。阅读完成不能等同掌握。题目关联 knowledge objective，反馈返回可信正确答案及简短解析，不泄露未提交题目的答案。

旧自建课程支持「补全意思与准备练习」。已经有学习记录时使用新课程副本/现有 revision 机制；不能直接删除或修改历史 assessment 的答案。避免只支持新建而把旧课程永远留在纯卡片模式。

## 4. 自动出题规则

当前实际启用五种可自动判分题型。每单元最多 8 道，同一条目可用不同题型练习，不能重复同一道题凑数；生成总量有服务器上限。来源无法可靠证明时省略判断/排序题，不用交换词义制造假题。实现题型边界见[使用说明](ai-personal-course-generation.md)。

| 资料 | 首版适合题型 | 限制 |
| --- | --- | --- |
| 纯词语 | AI 可补全可靠意思后生成词义单选；单个词不会凑干扰项 | 纯词语没有可靠意思时不生成确定答案 |
| 词语＋意思 | 词义单选、规则填空、规则配对 | 干扰项来自同单元可靠意思；配对要求每个词义唯一 |
| 知识点＋说明 | 说明单选、概念填空；直接原文否定可生成判断题 | 只使用用户原始说明作判断依据；拒绝条件句、复杂句和不能直接反驳的语义推断。AI 补充说明明确标记为 AI 来源 |
| 短句＋提示/来源说明 | 原句填空；英语/马来语 3–10 个唯一词块可排序 | 排序答案由原句生成且初始选项顺序打乱；不支持中文分词排序。短句填空以提示回忆原文，保留原标点 |

先规则生成有依据的题（例如已有词义配对），AI 用于补充缺失意思、解释和可靠干扰项。只有一个词时可生成提示回忆题，不能捏造三个错误答案凑选择。不要用「显然错误/完全不相关」干扰项。多义词、同义词、相同意思重复词不能互为单选干扰项。

AI 输出结构化 JSON，严格映射现有 question DTO/validation/seed factory。限制题数、选项数、文字长度、条目 ID、语言、正确答案数量；去重、拒绝答案泄漏、无效配对、缺失出处、未知 ID/题型。失败条目不采用且不按成功条目计费。不靠模型自报的 confidence 保证正确；不确定时要求用户确认或省略题目。

## 5. 服务端与 API 设计

采用「估价 → 生成 → 查看状态/结果 → 采用并保存」四阶段，遵循现有 CQRS 和 ApiResponse。准确路由与 DTO 名称可跟随 repo，但以下合同完整：

1. `POST /v1/education/course-drafts/generation-estimate`：provider 是否可用、每成功项的文本费用、最大预留 credits 和余额。
2. `POST /v1/education/course-drafts/generate`：requestId、units/entry stable IDs、内容语言、意思语言、难度、maxCredits；服务器校验输入，返回 generationId/status/结果。费用由服务端重新计算。
3. `GET /v1/education/course-drafts/generations/{requestId}`：按 requestId 精确查询，只有拥有者可读，返回 pending/completed/partial/failed、结果与实际费用；失败不输出原始 provider payload/栈。
4. `POST /v1/education/course-drafts/from-study-list`：传 generationId 和用户最终采用的条目/题目选择；服务端检查归属、input fingerprint、结果与采用内容一致，使用已有 seed factory 持久 assessment。客户端不能凭空提交 provider 成功状态或更改扣费。非 AI course save 保持兼容。

generator 接口置于 Application/Common/Interfaces，provider 实现在 Infrastructure/AI；controller 不调用 provider/EF。课程输入和 OCR 文本是数据，prompt 明确忽略其中的指令，不允许模型执行工具、URL 抓取或服务端文件读取。无 credentials 返回可操作的不可用状态；template 模式只运行规则能力，费用为零。

预留和结算复用 IAiCredits；网络等待不能持有 DB transaction。结果采用与课程持久化具备幂等性，重试不会创建多份 assessment；用户点两次只产生同一课程。Npgsql transaction 使用 execution strategy。若新增实体或列，必须补 EF migration、映射、snapshot 及测试。课程和生成任务均保持 private、ownership、UTC、soft delete 约定。

## 6. 可靠性、隐私与成本

限制 50 条沿用现有作者流程；按 provider batchSize 分批，控制并发，部分结果可恢复，generation version 写入 fingerprint。生成内容按账号保存于现有私人 AiGeneration 记录，用于精确恢复和后续采用；AI 缓存只在同一拥有者及相同内容版本复用，不能将私人资料作为公开共享缓存。既有意思不计补意思费用；实际成功计费规则在 estimate、settlement、UI 保持一致。成功补充的意思及成功的 AI 单选分别按 `ai.credits.textCost` 计费；规则填空/配对不计费；无效/待确认建议和失败批次不计费。

使用现有 stale reservation 恢复和 rate limits。无余额/无 provider/超时/取消/无效 JSON/部分成功/保存失败有相应 UI；重试同一个未决 requestId 会复用同一任务，失败任务必须使用新请求。不得记录原文、词义、答案、provider keys；只记录 job ID、阶段、计数及错误代码。当前无按相似内容复用的语义缓存。

## 7. UI 设计和验收

沿用 designSystem.ts、AppText/AppButton、LearningHeader、existing sheets、主题及反馈组件；不新增硬编码字号和颜色。360/390/430dp，标题合理换行，文本缩放、44pt touch target、屏幕阅读器、键盘、安全区、底部按钮都必须验证。每屏一个主按钮，筛选/高级选项收起。错误置于相关内容附近，按钮 pending 不闪烁，不用 toast 作为唯一结果。生成状态和 partial 结果文本清楚、不露后台实现。

## 8. 实施阶段及交付

阶段 A：**完成**。服务端合同、provider、规则生成/严格校验、credits 幂等、精确结果恢复及采用保存；typed mobile API；fake provider HTTP 端到端测试。

阶段 B：**完成，手机宽度主要流程验收通过**。作者流程 AI 卡片、费用说明、状态/恢复、预览/编辑/采用；建议映射到现有意思字段；旧课程详情提供「补充意思并准备练习」副本入口；复用现有练习播放器。

阶段 C：**本轮验收完成，原生设备与专项测试环境限制已记录**。使用既有 Admin AI 配置入口，不新增重复配置系统。用户边界见使用说明。未配置 provider 时如实报告，不以 mock 冒充成功；自动化使用 fake provider，主代理使用合成资料做真实 provider 与 UI 冒烟验证。

每阶段自查后继续，全部完成后报告。任何原定能力若实际未交付，明确列出，不用「完整自动」概括部分实现。

## 9. 检查矩阵

- 规则/解析：三语言、只有词语、已有意思不覆盖、多义、长句、重复、1 条/50 条、答案泄漏、非法/截断 JSON、无效 pairing/ordering。
- 服务端：所有权、RestrictedLearner、maxCredits、余额不足、并发重放、超时恢复、部分结算、生成成功保存失败重试、旧记录版本不变、真实持久化后 guided practice 可打开。
- UI：手动/粘贴/扫描进入同一确认页；AI 开/关；无余额/无 provider；离开恢复；编辑后旧题失效；预览删题；保存后课程有题；学习结束进入练习；错题结果。
- 运行 npm run check:mobile；backend build/unit/integration；如修改 Admin 则 check:admin。生产 Expo export 和手机宽度视觉检查。记录无法执行的原生或真实 provider 检查。

## 10. 参考依据

- Quizlet 官方：https://help.quizlet.com/hc/en-us/articles/360030841732-Studying-on-Quizlet ，资料与练习测试的联系。
- Quizlet 官方：https://quizlet.com/features/study-guides/ ，上传资料后编辑并转换为卡片/测验。
- Kahoot 官方：https://support.kahoot.com/hc/en-us/articles/36449742465437-How-to-use-Kahoot-AI-assistant ，使用上下文生成、准确性检查和人工修正。

以上是可参考的交互模式，不代表这些服务适用于 MemoPal 的所有儿童年龄、语言、价格或地区；MemoPal 的限制与能力由自己实现决定。

## 11. 实施结果与验证

- 已实现 estimate、generate、精确 requestId recovery 和采用保存 API；credits 走现有 `IAiCredits`，没有新增钱包或 schema/migration。
- 已实现 OpenRouter、Gemini、Ollama 的文本请求；模板/未配置时明确提示，采用无需 AI 的保存路径，不伪造生成成功。
- 知识点判断只由来源明确且直接的否定构造；短句可按可靠 token 条件排序，或按用户提示还原原句。新增 fake-provider 集成覆盖显式否定、条件句拒绝、隐藏知识点答案、双空格原句排序采用/练习、中文短句填空。
- 实际支持题型、配置路径、费用单位、恢复与隐私说明见[功能使用说明](ai-personal-course-generation.md)。
- 已验证：最近一次 `dotnet build MemoPal.slnx --no-restore` 成功；本轮 AI generation IntegrationTests 5/5；主代理最终完整 IntegrationTests 145 passed、6 skipped，UnitTests 358/358；mobile check 200/200、typecheck 通过、lint 0 errors / 6 existing warnings，Android production Expo export 成功。
- 完整 `npm run check` 的 Admin build/lint 通过；Admin Vitest 69/70，有一个无关的 `MemoryCollectionsPage` 测试超时。Postgres 专项测试因环境未配置而跳过。主代理已完成360/390/430dp Expo Web主要流程复验；没有连接原生设备，系统键盘、相机和字体缩放未验。最终证据见验收记录。
- 自动化集成使用 fake provider；本代理未发起新的真实付费 provider 请求，也未迁移用户运行数据库。
