# Syllabus-to-Memory 按需派生后端计划

日期：2026-10-26
状态：实现中；以代码和测试为准更新结果

## 范围与确认事实

- 派生只从当前可读取的 Published `EducationObjectiveStudyItem` 构造当前用户私有的 `MemorySet`；派生应用层不查询 `EducationQuestion`。StudyItems learner handler 当前仅查询 Published 项：`apps/api/src/MemoPal.Application/Features/Education/StudyItems/EducationStudyItemLearnerQueries.cs`。
- 课程读取授权入口是 `EducationStudyItemAccess.RequireReadAsync`，包括所有者、当前 active classroom 成员（assignment 或 classroom-course link）及公开可发现学习者；隐藏课程被拒绝：`apps/api/src/MemoPal.Application/Features/Education/StudyItems/EducationStudyItemLearnerQueries.cs`。
- `MemorySetAggregate.Create` 执行标题、方法、状态、私有可见性所需的内容校验、100 项上限、答案/提示长度、及 technique plan 校验；`CreateMemorySetCommandHandler` 额外校验私有 folder、Palace scene 和 AI image 归属：`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/Commands/CreateMemorySetCommand.cs`。
- 普通 MemorySet 创建本身不调用 XP、PracticeAttempt、连续天数或里程碑逻辑；这些写入目前来自练习提交/统计路径：`apps/api/src/MemoPal.Application/Features/MemorySets/Commands/CreateMemorySetCommand.cs`、`apps/api/src/MemoPal.Application/Features/PracticeAttempts/Commands/CreatePracticeAttemptBatchCommand.cs`。
- 删除 MemorySet 使用通用审计软删除：`apps/api/src/MemoPal.Application/Features/MemorySets/Commands/DeleteMemorySetCommand.cs`、`apps/api/src/MemoPal.Infrastructure/Persistence/AppDbContext.cs`。因此 FK cascade 不会在普通 API 删除时清理链接；计划在该删除用例内同步物理删除教育关联和映射，MemorySet/MemoryItem 实体不增加字段或规则。
- `MemoryItem` 的 Prompt、Answer、Hint 均为文本字段；聚合检查 Prompt/Answer ≤500，MemorySet 不超过 100 项；Number Peg 的 peg number 是 1–100：`apps/api/src/MemoPal.Domain/Entities/MemoryItem.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`。
- Palace 计划需要选定用户可访问的 scene 和 locus；创建 Draft 集允许 TechniquePlan 缺省：`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetPalaceValidator.cs`。

## 数据实体与迁移

新增 `EducationObjectiveDerivedMemorySet`：Id、ObjectiveId、MemorySetId、OwnerUserId、TechniqueKey、SourceContentHash、SourceItemCount、DerivedAtUtc、LastSyncedAtUtc，以及普通审计软删除字段。为 `(ObjectiveId, OwnerUserId, TechniqueKey)` 建立有效记录唯一索引；Objective 和 MemorySet FK。MemorySet 侧采用级联关系；由于 API delete 是软删除，删除用例另行硬删除这行和子映射。

新增 `EducationDerivedItemMap`：Id、DerivedId、StudyItemId、MemoryItemId、LastSyncedContentHash、审计字段。为 `(DerivedId, StudyItemId)` 与 `(DerivedId, MemoryItemId)` 建唯一索引；FK 约束派生、源条目和目标条目。

单独 EF migration `AddEducationObjectiveDerivedMemorySets`；回滚 `dotnet ef database update <该迁移之前的迁移名>`，或 `dotnet ef migrations remove`（仅限尚未应用且本地最后一条迁移）。不在生产运行/回滚。

## 创建复用与映射

教育 handler 先构造普通 `MemorySetUpsertRequest`（Private、Draft、无 folder、无 plan），然后通过 MemorySet 的应用创建路径复用 `MemorySetAggregate.Validate/Create` 与现有 Palace/AI 校验边界；MemorySet 仍不知道教育。派生 MemorySet 是可编辑草稿，学习者之后按既有 UI 选择 Palace 场景/生成 Peg 计划并转入现有练习状态。与 MemorySet、来源行、映射行在一次应用事务/保存中提交。

| Study item 类型 | MemoryItem Prompt | Answer | Hint | Palace | Number Peg |
|---|---|---|---|---|---|
| VocabularyPair | Primary | Secondary（必填） | Hint | 允许 | 允许，1–100 |
| LanguageItem | Primary | `拼音：{Phonetic}\n释义：{Secondary}`，至少一项非空 | Extra，Extra 空则 Hint | 允许 | 允许，1–100 |
| OrderedList | `第 N 步`（条目语言 zh-Hans 用“第 N 步”，其他语言用 `Step N`） | Primary | Hint | 允许 | 允许，1–100 |
| NumberDate | Primary | Secondary（必填） | Hint | 允许 | 允许，1–100 |
| VerbatimText | `第 N 句/段`（随语言） | Primary | Hint | 允许 | 允许，1–100 |
| CategoryMembership / FormulaSymbols / LabelDiagram | Primary | Secondary（必填） | Hint | 允许 | 允许，1–100 |
| ConceptUnderstanding / ReasoningProcedure / NotApplicable | — | — | — | 拒绝 `NotSuitableForMemoryTechnique` | 拒绝 `NotSuitableForMemoryTechnique` |

映射不截断。Prompt/Answer 超过现有 500 字符聚合限制或生成答案为空时拒绝并返回明确原因码。标题按 Unicode Rune/码点截断至 200；原文的语言取条目级 LanguageCode、否则取知识点 LanguageCode。记忆项顺序按照 Position。

适配矩阵：上表“允许”表示可生成待配置的 Draft MemorySet，不代表系统替用户生成个人联想、宫殿位置或 Peg 场景；Number Peg 条目数 1–100 可允许，0 或 >100 拒绝；Palace 条目数同样受 MemorySet ≤100 限制，具体场景可用 locus 数由用户选择后沿用现有 plan 校验。类型不匹配不强行记忆。

## 哈希、状态与同步

内容哈希使用 SHA-256，对 Published 项按 Position 排序后序列化稳定字段（StableKey、Position、Kind、Primary、Secondary、Phonetic、Extra、Hint、有效语言）。哈希比较前做 NFC、首尾 trim、CRLF 归一及连续空白归一；查询行枚举顺序不影响结果，Position 或有效内容变化会使哈希改变。单条哈希仅覆盖映射到 MemoryItem 的 Prompt/Answer/Hint 规范值。

状态查询重新验证来源访问授权，返回当前用户本知识点/方法派生集、isOutdated 和 added/modified/removed 计数，不返回内容或其他用户 ID。同步仅用户主动触发；修改仅当 MemoryItem 仍等于上次写入的规范内容哈希时应用；否则标记 skipped-user-edited。来源被撤回/删除视为 removed：不删除 MemoryItem、不删映射、不动绑定和练习数据。新增项追加位置。若总数将超过 100，事务整体拒绝。同步不改变 MemorySet Id、MemoryItem Id、TechniquePlan、PegBinding、PalaceBinding。

## 授权与 API

沿用 `EducationStudyItemAccess.RequireReadAsync`，每次状态/派生/同步均按当前用户检查 Course、Objective 及 Published source items；无权/不存在/隐藏/退班统一 NotFound。不得以 Admin 或家长角色额外授权。本人派生 MemorySet 通过既有 `ForUser` 读取；关系方不获得内容权。

- `GET /v1/education/public/objectives/{objectiveId}/memory-bridge`：适配、Published 条目计数、本人派生集状态、仅现有可见 assessment 摘要（若安全复用 learner query）；assessment 摘要可先不返回，避免答案面扩大。
- `POST /v1/education/public/objectives/{objectiveId}/memory-bridge/derive`，body `{ techniqueKey }`：创建或返回已有派生集 Id。
- `POST /v1/education/public/objectives/{objectiveId}/memory-bridge/{techniqueKey}/sync`：主动同步并返回数量与安全状态明细，不返回个人联想/内容快照。

错误原因码：`NotSuitableForMemoryTechnique`、`TechniqueCapacityExceeded`、`NoPublishedItems`、`RequiredAnswerMissing`、`MappedFieldTooLong`、`MemorySetItemLimitExceeded`、`UnsupportedTechnique`。不存在/无权/隐藏来源使用相同 not-found 响应，不返回可区分的资源原因码。

## 垂直实现切片

1. 领域映射/哈希与单元测试：每种类型映射、稳定散列、容量和错误码。
2. 教育来源实体/EF config/迁移：FK、唯一性、删除清理；EF pending-model 检查。
3. 派生 GET/POST：来源授权、幂等、私有 Draft、拒绝矩阵与无副作用测试。
4. 状态与同步：新增/修改/用户修改跳过/来源移除/超限原子性；绑定不变测试。
5. 文档/测试矩阵/验证：登记测试缺口更新与完整构建、单元/集成、EF 检查。

## 测试清单

- 单元：每类字段映射；每个生成 Prompt/Answer/Hint 的边界；顺序稳定、空白与 NFC 哈希；两技术适配和 Number Peg 1/100/101；类型拒绝原因；source item 增删改/用户修改分类。
- 集成：assignment 与 classroom link active student 派生；owner/public learner；未登录、无关、跨班、退班、hidden、Admin 无关系拒绝且 NotFound 响应相同；重复派生；MemorySet 为当前用户 Private/Draft；他人经 MemorySet GET/Community 不可见；同步规则与 Palace/Peg 绑定不变；delete 清理后可重新派生；practice/XP/streak/education attempts 未变化；DTO 不含答案键/作者字段；派生查询不引用题目表。
- 测试应按现有 integration fixture 支持的并行执行机制做隔离；附加并行注册 500 复现调查限本任务约 15%。

## 主要风险

- “派生后立即可练”与 MemorySet 既有不变量不同：Memory Palace/Peg 均需用户配置个人绑定；本实现创建 Draft，按既有流程继续配置，不自动编造联想。
- 由 `MemorySetAggregate` 复用同时避免为教育复制 MemorySet 校验，是关键集成点；若其内部性阻碍复用，只抽取最小 creator service，不增加 MemorySet 字段。
- 删除现有实体是软删除，教育关联清理必须在同一次 delete handler 路径中完成；数据库物理 FK cascade 仅作兜底。
- 不支持作者条目媒体转入 MemoryItem 图片/音频；派生只用文本字段。

## 首次实现结果（2026-10-26；加固后的验证见本文末尾）

状态：后端实现完成；本节只列当前代码与验证结果。

- 新迁移：`20261025184343_AddEducationObjectiveDerivedMemorySets`。回滚开发数据库：`dotnet ef database update 20261025172714_AddEducationClassroomCourses`；该迁移之后只回滚本地最新派生迁移。`Down` 删除 `EducationDerivedItemMaps` 和 `EducationObjectiveDerivedMemorySets`。未运行生产迁移。
- 新实体均使用 `AuditableBaseEntity` 与软删除约定；三类有效关联唯一索引使用 `IsDeleted = FALSE` partial filter。MemorySet 删除软删除，不触发 FK cascade，所以通用删除通知由 Education 侧 listener 清理关联和 maps；重新派生由集成测试验证。
- 实际路由：`GET /v1/education/public/objectives/{objectiveId}/memory-bridge`；`POST /v1/education/public/objectives/{objectiveId}/memory-bridge/derive` body `{ "techniqueKey": "palace" | "number-peg" }`；`POST /v1/education/public/objectives/{objectiveId}/memory-bridge/{techniqueKey}/sync`。
- GET 状态 DTO 只包含记忆类别、Published 数、方法适配/建议/错误码、调用者自己的集 ID、过期标记和条目变化计数。Derive 返回集 ID/方法/是否已存在。Sync 返回新增/更新/跳过/移除计数与状态代码/源条目 ID，不返回个人记忆内容。
- 错误码：`NotSuitableForMemoryTechnique`、`NoPublishedItems`、`RequiredAnswerMissing`、`MappedFieldTooLong`、`TechniqueCapacityExceeded`、`MemorySetItemLimitExceeded`、`UnsupportedTechnique`。统一写在 `ApiResponse.Errors`；未授权/不存在仍为相同 404。最大集容量沿用既有 100 条；Palace 后续绑定数量由既有 scene/locus validator 处理。
- 映射/哈希/同步细节见 `docs/education-memory-bridge-design.md` 第 14 节。派生集初始 Private/Draft，通过共享 `MemorySetCreation.BuildValidatedAsync` 复用现有校验；不能跳过现有 plan 配置直接开始 Palace/Peg 实践。修改未覆盖个人联想和绑定；被用户改过的题目跳过；来源被删除只报告而保留；新源项追加。
- 单元测试新增 14 项，集成测试新增 3 项。当前 API 单元全量 297 通过；集成全量 65 通过、2 个 PostgreSQL 条件测试跳过。EF has-pending-model-changes：无变化。PostgreSQL 环境变量未设置，迁移 rollback/reapply 未在本机运行。
- 并行问题尝试：单元与集成同时启动各一次，单元 297 通过、集成 65 通过/2 跳过，没有注册 HTTP 500；构建同时争用默认 `obj` 中间产物时出现一次 copy retry warning。该次尝试没有证明原 HTTP 500 的根因，也没有改测试夹具或生产代码。
- 限制：没有并发唯一约束冲突重试测试；没有 verified/revoked guardian 专项桥接 route test；没有真实 PostgreSQL 验证；没有移动端桥接 UI/媒体映射/自动 Palace Peg 生成；MemorySet 的现有 API 之后仍允许用户手动公开个人集。
- **最终综合验证**：本次 `npm run check` exit 0：mobile 118 测试通过、Admin 12 files / 44 tests 通过；`dotnet build MemoPal.slnx` 0 errors，15 existing NuGet advisory warning instances；API unit 297/297；API integration 65 pass / 2 PostgreSQL environment skips / 0 fail；EF `has-pending-model-changes` 无待迁移。PostgreSQL 环境变量未配置，PG apply/rollback/reapply 未运行。`git diff --check` exit 0（Git 显示文件行尾转换提示）。

- 并行复核补充（2026-10-26）：在同一已构建输出上同时以 --no-build --no-restore 执行 API 单元与集成测试，Unit 297/297 通过，Integration 65 通过、2 个 PostgreSQL 条件用例跳过、0 失败，退出码均为 0。前一轮并行编译尝试出现共享 obj 中间产物锁冲突（另一次隔离 BaseOutputPath 尝试有 copy retry）；未复现注册 HTTP 500。结论仍是 HTTP 500 根因未查明，当前证据只表明测试夹具有独立数据库名/内存根，且最终并行无编译测试通过；不据此声称彻底排除偶发竞争。

## 2026-10-26 按需派生加固核查

### A1. 创建 MemorySet 的副作用（代码已确认）

| 项目 | 结论 | 代码位置 |
|---|---|---|
| XP | `CreateMemorySetCommandHandler` 和派生 handler 创建集时不写 XP。XP/TotalXp 更新位于练习提交处理 | `apps/api/src/MemoPal.Application/Features/MemorySets/Commands/CreateMemorySetCommand.cs`; `apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs`; `apps/api/src/MemoPal.Application/Features/PracticeAttempts/Commands/CreatePracticeAttemptBatchCommand.cs` |
| 成就 | 创建集不触发 milestone。成就根据当前 User/Stats 由 milestone 查询路径惰性记录；创建本身不调该查询 | `apps/api/src/MemoPal.Application/Features/Milestones/Queries/GetMilestonesQuery.cs`; `GetMilestoneQuery.cs`; `CreateMemorySetCommand.cs` |
| 连续天数 | 创建集不更改 streak。streak 在 PracticeAttempt 提交/统计路径更新 | `apps/api/src/MemoPal.Application/Features/PracticeAttempts/Commands/CreatePracticeAttemptBatchCommand.cs` |
| 通知 | 创建集/派生集没有发布创建通知。现有 `MemorySetSoftDeletingNotification` 只在删除处理器中发布 | `apps/api/src/MemoPal.Application/Features/MemorySets/Commands/DeleteMemorySetCommand.cs`; `apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs` |
| 其他 | 创建私有 Draft、MemoryItem、教育来源关联和映射；现有创建器只读校验 folder、Palace scene、AI 图片引用。统一审计钩子记录创建元数据 | `apps/api/src/MemoPal.Application/Features/MemorySets/Commands/CreateMemorySetCommand.cs`; `apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs`; `apps/api/src/MemoPal.Infrastructure/Persistence/AppDbContext.cs` |

结论：**派生 Draft 不因创建触发 XP、成就、streak 或通知**。学习者以后主动提交普通 MemorySet 练习时，可能按普通自主练习规则产生 practice/XP/streak；这与教育测评成绩隔离。以上只核对仓库应用代码，未对部署中的 DB trigger、外部消息中间件或未提交的运行时代码动态审计。

### A2. 完整字段映射

| MemoryContentType | Prompt | Answer | Hint | 超长 / 缺值行为 |
|---|---|---|---|---|
| VocabularyPair | Primary | Secondary | Hint | 缺 Answer → `RequiredAnswerMissing`；映射文本超过 MemoryItem 限制 → `MappedFieldTooLong` |
| OrderedList | zh 语言 `第 N 步`，其他 `Step N` | Primary | Hint | 同上 |
| NumberDate | Primary | Secondary | Hint | 同上 |
| FormulaSymbols | Primary | Secondary | Hint | 同上 |
| CategoryMembership | Primary | Secondary | Hint | 同上 |
| LabelDiagram | Primary | Secondary | Hint | 同上 |
| VerbatimText | zh 语言 `第 N 句/段`，其他 `Line/section N` | Primary | Hint | 同上；原文不截断、不改写 |
| LanguageItem | Primary | `拼音：{Phonetic}` 和/或 `释义：{Secondary}`；非 zh 条目用 `Pronunciation:` / `Meaning:` | Extra 非空优先，否则 Hint | Phonetic 与 Secondary 均空 → `RequiredAnswerMissing`；拼合后超长 → `MappedFieldTooLong` |
| ConceptUnderstanding | — | — | — | palace/number-peg 均拒绝 `NotSuitableForMemoryTechnique` |
| ReasoningProcedure | — | — | — | 同上 |
| NotApplicable | — | — | — | 同上 |

LanguageItem 中文示例（原创，仅解释映射）：

| 类别 | Primary | Phonetic | Secondary | 派生 Answer |
|---|---|---|---|---|
| 生字 | 学 | xué | 学习、获取知识 | `拼音：xué\n释义：学习、获取知识` |
| 词语 | 清晨 | qīngchén | 太阳刚升起前后的早晨 | `拼音：qīngchén\n释义：太阳刚升起前后的早晨` |
| 成语 | 井然有序 | jǐngrán yǒuxù | 整齐而有条理 | `拼音：jǐngrán yǒuxù\n释义：整齐而有条理` |

文本按 NFC 与换行规则规范化；映射字段不截断。映射检查同时按 Unicode Rune 数与 MemorySet 现存 .NET string 长度限制；任一超过 500 会拒绝，原因码 `MappedFieldTooLong`。顺序或来源容量超过 100 在创建阶段为 `TechniqueCapacityExceeded`；同步造成目标集超过 100 为 `MemorySetItemLimitExceeded`。

### A3. 适配矩阵与测试固定的规则

统一硬限制是 1–100 项：来源容量由 `EducationMemoryDerivationRules.ValidateCapacity` 固定；MemorySet 100 项限制由 `MemorySetAggregate.Validate` 固定；Number Peg binding 数字也限 1–100：`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryDerivationRules.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`。Memory Palace 也受 MemorySet 100 项限制，但实际可绑定位置还受所选 scene loci 数量限制；当前模板每场景约 10 个，starter room 为 12 个：`apps/api/src/MemoPal.Api/Security/AdminBootstrapper.cs`。

| 内容类型 | Palace | Number Peg | 代码给出的建议 |
|---|---|---|---|
| VocabularyPair | 允许 | 允许 | Palace 推荐，Peg 可用但非推荐 |
| LanguageItem | 允许 | 允许 | Palace 推荐，Peg 可用但非推荐 |
| VerbatimText | 允许 | 允许 | Palace 推荐，Peg 可用但非推荐 |
| OrderedList | 允许 | 允许 | Number Peg 推荐，Palace 可用但非推荐 |
| NumberDate | 允许 | 允许 | Number Peg 推荐，Palace 可用但非推荐 |
| FormulaSymbols | 允许 | 允许 | 两种均可用但均非推荐；依题材决定，不代表适合推理 |
| CategoryMembership | 允许 | 允许 | 两种均可用但均非推荐 |
| LabelDiagram | 允许 | 允许 | 两种均可用但均非推荐 |
| ConceptUnderstanding / ReasoningProcedure / NotApplicable | 拒绝 | 拒绝 | `NotSuitableForMemoryTechnique` |

固定映射/容量测试：`apps/api/tests/MemoPal.UnitTests/EducationMemoryDerivationTests.cs` 的 `Every_supported_study_item_kind_maps_to_private_memory_fields`、`Reasoning_and_unclassified_content_is_rejected`、`Technique_capacity_accepts_one_through_one_hundred_and_rejects_empty_or_over_limit`。这些单元测试固定字段映射与 0/1/100/101 容量，不会证明每一种类型的 Palace/Number Peg 推荐布尔值；该推荐目前由状态 handler 的 `Fit` 函数给出，需列为剩余测试缺口。

### B. 12 项集成验收用例对照

| # | 集成用例 | 现有测试名 | 状态 |
|---:|---|---|---|
| 1 | active 课堂学生从可读的 Published 源派生本人 private Draft，重复请求返回原集 | `Active_linked_student_can_derive_private_memory_and_repeat_without_duplicate_or_education_side_effects` | 已覆盖 |
| 2 | 退班后本人仍可读已派生集，但学习条目状态及同步都拒绝 | `Derived_memory_remains_owner_only_after_withdrawal_for_teachers_students_and_guardians` | 本次新增 |
| 3 | 课程所有者与当前任课教师不能读取该学生的派生集 | 同上 | 本次新增 |
| 4 | 同班其他 active 学生不能读取该学生的派生集 | 同上 | 本次新增 |
| 5 | 已验证及已撤销监护人均不能读取派生集 | 同上 | 本次新增 |
| 6 | 派生 private 集不出现在 Community 目录与按条目搜索 | `Derived_memory_remains_owner_only_after_withdrawal_for_teachers_students_and_guardians`（此前目录仅有列表断言，本次加 search） | 本次补强 |
| 7 | 删除派生 MemorySet 清理 active provenance/maps，之后可重新派生 | `Active_linked_student_can_derive_private_memory_and_repeat_without_duplicate_or_education_side_effects` | 已覆盖 |
| 8 | 用户修改过的 MemoryItem 不被源同步覆盖、源已移除的个人条目保留 | `Sync_adds_updates_only_untouched_items_and_keeps_removed_and_user_edited_items` | 已覆盖 |
| 9 | PalaceBinding 与其个人联想在源同步后保持完整 | 同上 | 本次补强 |
| 10 | PegBinding 与其 SceneText 在并发同步后保持完整且新条目只添加一次 | `Concurrent_derivation_and_sync_requests_do_not_create_duplicate_derived_rows_or_items` | 本次新增 |
| 11 | 并发双击派生都返回同一 MemorySetId，只有一个 active 派生记录 | 同上 | 本次新增；曾以 8 个请求复现不同 ID |
| 12 | Palace/Number Peg 超 100 项拒绝且无部分派生；同步超限也原子拒绝 | `More_than_one_hundred_published_items_are_rejected_without_partial_derivation`（Palace、Peg 两行 theory）；`Sync_over_one_hundred_items_is_atomic_and_keeps_the_existing_derived_item` | 本次新增 |

额外已有覆盖：状态隐藏/非适配拒绝、跨用户 MemorySet GET 404、无教育/PracticeAttempt/XP 写入：`Derivation_status_rejects_unsupported_types_and_hidden_sources_with_not_found_parity`、`Active_linked_student_can_derive_private_memory_and_repeat_without_duplicate_or_education_side_effects`。测试文件：`apps/api/tests/MemoPal.IntegrationTests/EducationStudyItemEndpointsTests.cs`。

### C. 并发幂等实现与限制

**已复现：** 新的 `Concurrent_derivation_and_sync_requests_do_not_create_duplicate_derived_rows_or_items` 初始红测向同一 endpoint 并发发 8 个请求，旧实现返回多个不同 MemorySetId，证明应用层“先读后写”在 InMemory 集成环境里不能保证幂等。

**修复：**

- 增加 128 条有界进程内 stripe lock，按 `(操作, user, objective, technique)` 序列化同进程同 key 请求：`apps/api/src/MemoPal.Infrastructure/Education/StripedEducationMemoryBridgeLock.cs`、`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/IEducationMemoryBridgeLock.cs`。
- 数据库仍以已有 partial unique index 处理跨进程派生冲突。捕获 PostgreSQL SQLSTATE `23505` 后 rollback、清理跟踪并读取赢家；派生返回已有 MemorySetId。同步在同类 unique conflict 后 rollback、清 tracking 并重新计算，最多重试两次：`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs`。
- 派生与同步均在事务中保存 MemorySet、provenance、item map 及新增条目；冲突回滚整个该请求，避免孤立 MemorySet 或单边映射。
- InMemory 并发 HTTP 测试覆盖同进程竞争；该 provider 不执行唯一索引，也不模拟事务失败，因此不代表跨进程 PostgreSQL 已在本地运行验证。新增条件 PostgreSQL 用例 `Concurrent_derivation_and_sync_across_independent_contexts_are_idempotent`，使用两个独立 `AppDbContext` 和不同 lock 实例，走数据库唯一索引/冲突回读路径：`apps/api/tests/MemoPal.IntegrationTests/PostgresEducationSlice0Tests.cs`。当 `MEMOPAL_CREDIT_TEST_CONNECTION` 未设置时该项会跳过。
- 本机执行顺序见 `docs/dev/education-derivation-testing.md`。不构建与测试同时运行；并行测试必须先 build，再以 `--no-build --no-restore` 运行，API 并行集成测试预留至少五分钟。

### 本次最终检查（2026-10-26）

- `npm run check`：exit 0；Mobile typecheck + lint + 118/118 tests；Admin build + lint + 12 files / 44 tests。Mobile 有 2 条既有 hook dependency lint warnings；Admin lint 无警告。构建有既有大 chunk advisory，测试有 AntD rowKey deprecation 和 jsdom pseudo-element notices。
- `dotnet build MemoPal.slnx --no-restore -p:BaseOutputPath=C:\Temp\MemoPal-Derivation\hardening-final\`：通过，0 errors、15 条既有 NuGet advisory warning。由于默认 DLL 曾被 Visual Studio/API 进程锁定，最终构建使用隔离 BaseOutputPath。
- API 单元串行与并行（先 build，再 `--no-build --no-restore`）：每次 297 通过、0 跳过、0 失败。
- API 集成串行与并行：每次 70 通过、3 跳过、0 失败（总 73）。跳过：`PostgresAiCreditTests.MigrationsAndIndependentConnectionsEnforceAtomicReservations`、`PostgresEducationSlice0Tests.Concurrent_derivation_and_sync_across_independent_contexts_are_idempotent`、`PostgresEducationSlice0Tests.Slice0_and_classroom_course_migrations_round_trip_and_enforce_schema`；原因是 `MEMOPAL_CREDIT_TEST_CONNECTION` 未配置。PostgreSQL 往返及跨 context 竞争路径本机未执行。
- EF `migrations has-pending-model-changes --no-build`：无模型变更待迁移。首次未加 `--no-build` 的 EF 尝试因默认 build 失败；重试成功，EF Tools 10.0.5 比 runtime 10.0.11 旧。
- `git diff --check`：通过；仅报告既有工作树多个文件的 CRLF/LF 行尾规范化提示。
