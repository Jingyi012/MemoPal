# Syllabus-to-Memory 桥设计 v2

状态：目标架构提案；后端切片 0 已实现（见第 12 节），其余目标仍待产品确认与后续实现。  
日期：2026-10-26

## 0. 标记和安全边界

- **[代码已确认]**：当前实体、API、UI、路由、测试或 Git 历史可直接证明；每条附源文件路径。
- **[尚未验证]**：源码中虽有机制，但没有验证实际生产数据、设备 UX、媒体权限部署或真实 PostgreSQL 运行。
- **[建议]**：本版设计，不代表已实现或已获产品批准。

始终保持：正式成绩、排名和掌握证据属于 Education；不得写成 XP，也不得把测评结果写进 `PracticeAttempt`。记忆法练习若调用现有自主记忆流程，`PracticeAttempt` 仅记录普通回忆练习，不承载测评分数。学生答题 DTO 不返回答案键。平台 Admin 身份不替代课程所有权、当前任课关系、active 班级成员关系或已验证监护关系。

## 1. A1–A9 只读核实结论

### A1. 非所有者能否直接练习 MemorySet？个人宫殿数据归属哪里？

**[代码已确认]** Palace 和 Number Peg 会话按 `memorySetId` 读取记忆集；该查询通过 `db.ForUser(request.UserId)` 限定所有者，所以拿到非本人 ID 不能直接打开私有集。现有从 Community 使用别人的集的路径是先显式复制到当前用户 Library，再练本人副本。依据：`apps/api/src/MemoPal.Application/Features/MemorySets/Queries/GetMemorySetQuery.cs`、`apps/mobile/src/features/palace-scenes/screens/PalaceMemorySessionScreen.tsx`、`apps/mobile/src/features/number-peg/screens/NumberPegSessionScreen.tsx`、`apps/api/src/MemoPal.Application/Features/CommunityMemorySets/Commands/CopyCommunityMemorySetCommand.cs`。

**[代码已确认]** `MemorySet` 持有 `UserId`；`MemoryItem`、`TechniquePlan`、`PalaceBinding`、`PegBinding` 均以父集/计划/记忆项 ID 关联，不是各自的独立个人库。Palace 的 `AssociationText`、Peg 的 `SceneText`/配方存于绑定行；自定义宫殿 `PalaceScene` 有 `UserId`，其 `PalaceLocus` 挂在 scene 下。依据：`apps/api/src/MemoPal.Domain/Entities/MemorySet.cs`、`MemoryItem.cs`、`TechniquePlan.cs`、`PalaceBinding.cs`、`PegBinding.cs`、`PalaceScene.cs`、`PalaceLocus.cs`。

### A2. Community 复制实际复制什么？可否作为课程派生基础？

**[代码已确认]** 复制会基于可发现的公开源集新建当前用户拥有、Private 可见的 `MemorySet`，复制标题/描述/技巧/目标类型、MemoryItem 的位置/prompt/answer/hint/音频 URL，以及 TechniquePlan 和绑定；保留 `CopiedFromMemorySetId` 与每个副本 item 的 `OriginMemoryItemId`。若源集使用作者自定义 Palace，且作者 `SharesPrivateAssets`，复制流程另建当前用户拥有的 PalaceScene/Loci，并复制地点坐标、双语标签、图片 URL 引用及绑定联想；它复制的是数据库记录/URL 引用，不复制媒体二进制文件。依据：`apps/api/src/MemoPal.Application/Features/CommunityMemorySets/Commands/CopyCommunityMemorySetCommand.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`、`apps/api/src/MemoPal.Domain/Entities/MemorySet.cs`。

**[代码已确认]** 现有复制命令只从 Community 可发现集读取，不能直接由 EducationObjective/学习条目派生，也没有来源课程版本字段。**[建议]** 可复用“服务端创建用户所有的 MemorySet、标记源 ID、复制已获准的源项目”的机制，但课程派生应使用自己的授权和幂等规则，不应调用公开 Community copy API 冒充课程授权。

### A3. question 是否带 objective；objective 到 assessment 是否可推导？

**[代码已确认]** `EducationQuestion` 同时有 `AssessmentId` 和 `ObjectiveId` 两个外键；因此可以对某个 Objective 查询其关联问题，再汇总这些问题所属的 Assessment，形成 objective → assessment 的派生映射，不必新增直接 FK。现在没有显式独立映射表，也不能从没有关联题目的知识点推导测评。依据：`apps/api/src/MemoPal.Domain/Entities/EducationQuestion.cs`、`apps/api/src/MemoPal.Infrastructure/Persistence/EducationQuestionConfiguration.cs`、`apps/api/src/MemoPal.Application/Features/Education/Authoring/DTOs/EducationAuthoringDtos.cs`。

### A4. 课程/知识点/测评发布与版本

**[代码已确认]** `EducationCourse` 有 `IsPublic` 和 `PubliclyPublishedAt`，切换公开可见性本身没有课程内容版本快照。`EducationObjective` 是当前课程下可直接更新的行，没有独立版本。`EducationAssessment` 有 `Version`；仅 Draft 可执行 `UpdateDraft`，发布后不可原地编辑；Assignment/Recipient 记录所分配 `AssessmentVersion`。依据：`apps/api/src/MemoPal.Domain/Entities/EducationCourse.cs`、`EducationObjective.cs`、`EducationAssessment.cs`、`EducationAssignment.cs`、`apps/api/src/MemoPal.Application/Features/Education/Authoring/Commands/PublishAssessment.cs`、`UpdateAssessment.cs`。

**结论：** 知识点目前不随不可变课程版本发布。公开课程的知识点/推荐资源与当前课程行读取；测评版本则独立且 assignment 会固定其版本。**[尚未验证]** 当前版本机制在正式部署中是否有额外数据库备份/审计流程补充，源码未证明。

### A5. MemoryItem 结构、限制和媒体支持

**[代码已确认]** MemoryItem 字段为 `MemorySetId`、`Position`、`Prompt`、`Answer`、`Hint`、`PronunciationAudioUrl`、`NormalizedAnswer`、`OriginMemoryItemId`；单集最多 100 项，prompt/answer 各最多 500 字符，答案必填，位置为唯一正整数。MemoryItem 没有图片字段，也没有 language/locale 字段；声音以 URL 引用，不是音频二进制列。Palace/Peg 场景图像、场景文字和配方位于 TechniquePlan/Binding/PalaceScene，不是通用 MemoryItem 图像。依据：`apps/api/src/MemoPal.Domain/Entities/MemoryItem.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/DTOs/MemorySetDtos.cs`、`apps/api/src/MemoPal.Domain/Entities/PalaceBinding.cs`、`PegBinding.cs`、`PalaceScene.cs`。

### A6. Practice 如何选方法/传 MemorySet？可复用什么路由参数？

**[代码已确认]** 通用 Practice Tab 从意图（词、数字、列表、演讲、地点）推荐 technique，再跳转到 technique 根页面；此处没有把知识点或 MemorySet ID 作为参数传入。记忆集会话路由分别是 `/palaces/memory/[memorySetId]` 与 `/number-peg/[memorySetId]`，接受 `memorySetId`、`mode`、`restart`，以及受白名单限制的 `returnTo`（Palace: `practice|palaces`；Peg: `practice|number-peg`）。结束时可返回现有根页或 `router.back()`。依据：`apps/mobile/src/features/memory-hub/screens/PracticeScreen.tsx`、`apps/mobile/src/app/palaces/memory/[memorySetId].tsx`、`apps/mobile/src/app/number-peg/[memorySetId].tsx`、`apps/mobile/src/features/palace-scenes/screens/PalaceMemorySessionScreen.tsx`、`apps/mobile/src/features/number-peg/screens/NumberPegSessionScreen.tsx`。

### A7. MemorySet 练习 XP/连续天数及封闭模式影响

**[代码已确认]** 自主记忆练习写 `PracticeAttempt` 后更新 `UserStats` 的连续天数，再按首次回忆/到期复习/额外练习条件发 XP；额外练习有每日上限，重复 event 幂等。XP 与 streak 触发点在常规练习 attempt handler，不是 Education grade handler。Community weekly leaderboard 以回忆练习数据计分/计算参与，周榜还有显式 opt-in。依据：`apps/api/src/MemoPal.Application/Features/PracticeAttempts/Commands/CreatePracticeAttemptBatchCommand.cs`、`apps/api/src/MemoPal.Application/Features/Leaderboards/Queries/GetCurrentCommunityLeaderboardQuery.cs`、`apps/mobile/src/features/leaderboard/screens/CommunityLeaderboardScreen.tsx`。

**[建议]** 儿童封闭模式可保留只对本人可见的 streak/XP 激励；给 MemorySet 练习记录加无成绩含义的来源范围，例如 `education-private`，并让 Community leaderboard 明确排除该来源。关闭 Community UI 不能代替服务端过滤，否则带课程来源的练习事件可能进入现有周榜。正式成绩、排名、掌握证据仍不触发 XP 或记忆练习记录。

### A8. 课程/MemorySet 语言字段及多语言

**[代码已确认]** 当前 EducationCourse/Objective/Assessment/Question 与 MemorySet/MemoryItem 均没有语言字段；MemoryItem 是一般文本字段。PalaceLocus 有 `NameEn/NameZh/DescriptionEn/DescriptionZh`，这是地点 UI 文案，不是课程语言元数据。移动端 i18n 当前有系统语言/中文/英文选择；未找到马来文 app UI 字典。Admin Education 页面用英语标签/文案，未见同等 i18n 字典。依据：`apps/api/src/MemoPal.Domain/Entities/EducationCourse.cs`、`EducationObjective.cs`、`EducationAssessment.cs`、`EducationQuestion.cs`、`MemorySet.cs`、`MemoryItem.cs`、`PalaceLocus.cs`、`apps/mobile/src/core/i18n/i18n.ts`、`apps/admin/src/features/education/pages/EducationCoursePage.tsx`。

### A9. Community / 周榜入口

**[代码已确认]** Community 是底部 tab `/(tabs)/community`，当前渲染公开 MemorySet Discover；Discover 页有周榜快捷入口到 `/community/leaderboard`，其目录页再进入 `/community/leaderboard/community-weekly`。Community tab 也提供课程目录/作者入口（见相关 discover/course 页面）。Community weekly page 有加入/退出、站位、奖励和分享。依据：`apps/mobile/src/app/(tabs)/_layout.tsx`、`apps/mobile/src/app/(tabs)/community.tsx`、`apps/mobile/src/features/library/screens/DiscoverMemorySetsScreen.tsx`、`apps/mobile/src/app/community/leaderboard.tsx`、`apps/mobile/src/app/community/leaderboard/community-weekly.tsx`、`apps/mobile/src/features/leaderboard/screens/LeaderboardCenterScreen.tsx`、`CommunityLeaderboardScreen.tsx`。

**[建议]** 封闭模式需屏蔽 Community tab、周榜目录/详情与 API、周榜邀请/分享、公开课程/MemorySet 搜索与详情、收藏/复制/举报以及登录后恢复的 Community deep link。只隐藏按钮不足以保护 API 数据。

## 2. v1 中被证伪或需收窄的假设

1. **“把外部 MemorySet ID 传给会话即可直接练习”不成立。** MemorySet 查询按当前 UserId 限制；非所有者目前需复制/派生为自己的 set（A1）。
2. **“复制 Community 记忆集不复制个人内容”不成立。** 当前 copy 明确复制 MemoryItem、技巧计划和绑定；共享自定义 Palace 还会复制场景/Loci 数据并引用场景媒体 URL（A2）。
3. **“课程推荐集只是 ID 关联，因此其内容可立即由学生练习”不成立。** 当前课程详情推荐只允许当前可发现的公开集；之后还需 copy 到本人 Library。依据：`SetEducationObjectiveMemoryRecommendation.cs`、`GetEducationPublicCourseQuery.cs`、`PublicMemorySetDetailScreen.tsx`。
4. **“测评映射必须新增 Objective↔Assessment 表”不成立。** 现有题目已有 AssessmentId 与 ObjectiveId，可计算关联（A3）；只有要支持无题目关联的人工推荐/课程自定义排序时才考虑显式映射。
5. **“课程发布会冻结全部知识点内容”不成立。** Course 没有内容版本，Objective 可变；仅 Assessment 有已发布版本且 assignment 冻结 assessment version（A4）。
6. **“记忆条目已支持多语言和图像”不成立。** MemoryItem 无语言/图片字段；仅有音频 URL；TechniquePlan/PalaceScene 承担部分场景图片能力（A5/A8）。
7. **“封闭课程从 Community 跳转即可隔离”不成立。** Community 有周榜、公开资料和 share/deep-link 入口，常规 MemorySet 回忆还会更新通用 streak/XP（A7/A9）。必须设计来源范围和服务端输出过滤。

仍然成立：教育正式成绩/排名/掌握证据不能进入 XP 或普通记忆练习；公开分享不应暴露儿童的课程作答、个人联想和宫殿位置；课程资料可以 ID 引用 MemorySet，而不是嵌入整份 set。旧设计记录见 `docs/education-memory-bridge-design.md`（v1 Git 历史）与 `docs/education-assessment-plan.md`。

## 3. 核心模型：课程学习条目

### 3.1 建议的关系

**[建议]** 在课程/Objective 当前模型上增设明确的课程层级与学习条目：

```text
EducationCourse
  └─ EducationCourseRevision (immutable published revision)
       └─ EducationUnit (stable ID + unit order; revision membership)
            └─ EducationObjective (stable ID; optionally belongs to a unit)
                 └─ EducationObjectiveStudyItem (stable identity)
                      ├─ EducationObjectiveStudyItemRevision (versioned typed payload)
                      └─ EducationStudyItemMediaReference (media ID references)
```

`EducationCourseRevision` 在课程内容公开/机构发布时固定一次结构；`EducationObjectiveStudyItemRevision` 保存每个条目当前发布版本的结构化正文。Objective ID 稳定，revision ID 区分教学材料版本。修改已发布内容先产生新草稿修订，只有再次发布才替换当前公开/机构可用版本；学生已有派生集继续指向旧版本。

### 3.2 字段、类型和校验

**[建议]** `EducationObjectiveStudyItem` 稳定实体：

| 字段 | 类型/约束（建议） | 说明 |
|---|---|---|
| `Id` | opaque ID，服务端生成 | 不把 slug 当授权凭证 |
| `ObjectiveId` | FK | 所属知识点 |
| `StableKey` | 1–80 字符，课程内唯一 | 导入幂等/更新对账 |
| `ContentType` | 受控枚举 | 见第 4 节 |
| `Position` | 1…500，知识点范围唯一 | 仅为课程条目顺序 |
| `DefaultLanguageTag` | BCP-47（建议 `zh-CN`、`en`、`ms-MY`） | 表示正文使用语言，不推断 UI 语言 |
| `ReviewStatus` | `unreviewed` / `teacher-reviewed` / `approved-for-public` / `rejected` | 默认 `unreviewed`；公开资料需显式审批 |
| `CreatedByUserId` / timestamps | 服务端审计字段 | 客户端不能伪造作者/审核者 |

`EducationObjectiveStudyItemRevision`：`StudyItemId`、`CourseRevisionId`、单调递增 `ContentVersion`、`PayloadSchemaVersion`、`PayloadJson`（类型化结构）、`SourceNote`、`ReviewStatus`、`ReviewedByUserId`、`ReviewedAtUtc`。公开/班级学习读取只选择对应授权的已发布 revision。

**建议的长度边界**（新规则，非当前代码事实）：Course/Unit/Objective title ≤200 字符；StableKey ≤80；BCP-47 tag ≤35；类型 payload 总体 ≤10,000 UTF-8 字符；普通结构字段 ≤500 字符。`verbatim-text` 使用最多 50 个有序 segment，每段 ≤500 字符，总量 ≤10,000；每个图示 label 的文字 ≤200，label 数量 ≤100；单项允许最多 10 个媒体引用。API 与导入器必须执行同一服务端校验，不能只由 UI 截断。MemorySet 生成后仍受现有 MemorySet 项数/文本规则约束。

正文语言校验：接受明确允许列表中的 BCP-47 值；首期允许 `zh-CN`、`en`、`ms-MY`，支持条目层覆盖课程默认语言。拒绝空白、格式非法和不在机构/产品允许列表的值。内容本身可包含中英文/马来文词项，不能通过自动翻译覆盖作者原文；UI locale 与学习内容 language 分离。

排序：Unit、Objective、StudyItem、segment 和 diagram label 均有 `Position`；批量保存要求同一父级下不重复、从 1 连续或明确稳定排序规则。导入时按 StableKey 定位并保留用户已有 ID。

媒体引用：`EducationStudyItemMediaReference` 保存 `StudyItemRevisionId`、现有 media asset ID、用途枚举（`illustration`/`label-diagram`/`audio-prompt`/`pronunciation`）、排序、alt text；不在学习条目内嵌二进制或任意 URL。读取时重新验证媒体 asset 与课程/班级授权；课程条目引用 private media 不会使之 public。使用现有媒体服务的具体授权接口需在实现前核实，不在本设计中假定它已支持课程受众。

### 3.3 Payload 结构建议

采用版本化 JSON union，而不是把各类型挤进 Prompt/Answer 两个通用字段：

- `vocabulary-pair` / `language-item`：`term`、`pronunciation?`、`meaning`、`example?`、`languageTag`。
- `ordered-list`：`steps[]`，每步有稳定 `key`、`text`、`position`。
- `number-date`：`label`、`value`、`unit?`、`context?`。
- `formula-symbols`：`expression`、`symbolNotes[]`、`memorizeScope`（仅公式形式/符号），不表示会推导。
- `category-membership`：`categories[]`，每项含 category key、label 和成员列表。
- `verbatim-text`：`title?`、`segments[]`（有序的句/行/分句块，每段可标 `stanza/paragraph/sentence`）、`sourceNote`、`reviewStatus`。
- `label-diagram`：一个媒体 ID；每个标签含稳定 key、位置（normalized x/y，可选）、label text、可接受的 response label；图片仅通过媒体 ID 引用。
- `concept-understanding`：`explanationSummary`、`contrastPairs?`、`examples?`，默认普通学习方式，不自动映射为 MemorySet。
- `reasoning-procedure`：步骤可用于教学/提示但不是记忆答案集；该类型不能生成桥接 MemorySet。

### 3.4 作者编辑和读取权限

**[建议]** Admin/Education 作者工作台在课程 → Unit → Objective → Study items 中编辑；按类型展示结构化表单、语言、顺序、媒体引用、审核状态与发布预览。保存草稿不直接影响学生正在学的 revision；发布前预览普通学生可见 projection。批量导入推荐 JSON（第 7 节），错误要逐项定位并可下载。

每次读取由 API handler 按资源重新校验：

1. 课程所有者：只读/编辑本人课程范围；
2. 当前任课教师：只可读取本人当前任课关系所授权的课程/班级；跨班不因 Teacher capability 获权；
3. active 学生：只可读当前课程 publication/audience 覆盖的学习条目；active 状态及期限每次由服务端确认；
4. 公开课程学习者：只读当前仍 `IsPublic`、未 moderation-hidden 的已发布课程 revision；
5. 已验证监护人只可读其被授予的孩子的任务/已发布报告，不因此得到课程作者材料的编辑权或孩子个人 MemorySet 内容。

平台 Admin 单独不满足上述任一课堂/课程/监护关系校验。Admin support 操作如另有需要，必须使用明确审核端点并留下审计，不由普通课程 API 绕过关系检查。

学习条目不是测评答案键：它是作者明确标记、审核并授权给当前课程受众的教学源材料；正式题的 `AnswerKeyJson` 仍留在 EducationQuestion 私有评分数据。它不从答案键自动推导，学生 DTO 不承载答案键。作者工作台要明确区分“可用于学习的 syllabus/source content”和“保密 assessment authoring”；保密考试题/答案、评分 rubric、未发布题解不得导入或发布为公共学习条目。公开课程/条目审核记录要提醒作者：公开内容不能作为保密考试题。

## 4. 记忆类型与适配

`MemoryContentType` 是作者维护的教学标签，不是记忆算法强制指令。Palace / Number Peg 都为可选；不适合时正常学习和测评入口不受影响。

| 类型 | 条目结构/分块 | Palace | Number Peg | 说明 |
|---|---|---|---|---|
| `vocabulary-pair` 词/释义 | 一个词项+释义，可带例句/发音 | 适合 | 可用 | 语义/图像联想；音频只作发音，不把识别等同主动回忆 |
| `language-item` 生字、成语、拼音、外语词汇 | 字/词、拼音或读音、词义、例词；zh/en/ms 单项标注 | 适合 | 短词表可用 | 生字书写需写字练习，成语用法需语境题；Malay 词汇用 `ms-MY`，不可硬编码翻译 |
| `ordered-list` 有序步骤 | 每步独立有序、不可重复 stable key | 很适合 | 很适合 | 适合朝代、步骤、流程；推理型证明步骤不因有顺序而变成死记任务 |
| `number-date` 数字/日期/事实 | 标签、原值、单位/上下文 | 可用 | 很适合 | 适合记日期/常数；不取代数值推理或单位换算 |
| `formula-symbols` 公式形式 | 原式、符号注释、明确可记范围 | 可选 | 可选短式 | 只辅助记忆公式形式；推导、变形、证明、解题练习都不适用记忆法代替 |
| `category-membership` 分类成员 | 固定分类及每类成员 | 可用 | 短类别可用 | 只对约定标签/成员事实；考察归类理由/迁移时用解释与新情境题 |
| `verbatim-text` 古诗、课文、默写 | 保留标点与原始顺序；按 stanza/paragraph/sentence 断成 ≤500 字符小块，按课程规范保存行/句边界 | 适合长文本分段放置 | 只适合短句/短段 | Palace 可按地点逐块回忆。Peg 对长篇不推荐；不能重排字句、拼接改写为“原文”。默写还需无提示输入/书写测评 |
| `label-diagram` 图示标注 | 图 media ID + stable label/坐标/可接受标注 | 有条件适合 | 多标签时不适合 | Palace 可把部位标签映射地点，图示仍要练视觉定位；Peg 只可用于很短的固定部位序列，不适合大量空间标签 |
| `concept-understanding` 概念理解 | 解释概要、对比项、例子 | 仅辅助术语/小定义 | 仅辅助简短定义 | 主体用解释、比较、例题、提取与迁移测验；不要把能背定义标为理解 |
| `reasoning-procedure` 推理/多步求解 | 可编写教学步骤/提示，但不是记忆答案清单 | 不推荐 | 不推荐 | 数学推理、证明、应用题、因果分析和策略选择应通过做题/解释/反馈学习 |
| `not-applicable` 未分类/无需记 | 无学习条目或暂不提供 | 不显示桥接 CTA | 不显示桥接 CTA | 默认值；课程和测评正常可用 |

**默写分块规则**：一条 study item 可放一首短诗/一段课文；超过 500 字符拆成稳定 stanza/paragraph 子块；保留原文顺序和标点，允许按每段首尾文本/段号定位；派生时一块成为一个记忆项/若题量过多按教师设置拆成多个 set，不可静默丢字。默写能力最终由 Education 的无提示填空/简答/人工批改评估，不由 Palace/Number Peg 的练习成绩宣布掌握。

## 5. B' 派生机制、同步与隐私

### 5.1 建议的 ID 关系

**[建议]** 保留课程学习条目 revision 为源，由服务端按需创建用户所有的 Private MemorySet：

```text
EducationDerivedMemorySetLink
  Id
  OwnerUserId
  SourceObjectiveId
  SourceCourseRevisionId
  SourceContentVersion
  MemorySetId                 // FK/reference to user-owned MemorySet
  TechniqueKey
  CreatedAtUtc
  LastSeenSourceContentVersion
  SyncStatus

EducationDerivedMemoryItemLink
  DerivedLinkId
  SourceStudyItemId
  SourceStudyItemRevisionId
  MemoryItemId                 // link only; personal plan/bindings remain in MemorySet domain
```

`MemorySet` 内保存用户练习真正需要的 Prompt/Answer/技巧计划；Education link 只保存来源 ID 和版本，不再嵌入个人联想、宫殿地点、Peg 场景、答案测评或图片二进制。用户因授权 syllabus 创建自己的学习材料副本是允许的教育派生行为；v1 “不复制”仅禁止把个人联想/宫殿位置/图片回写教育记录、作业/测评或公开内容，**不禁止**从授权学习条目给本人创建独立私有 MemorySet。

所有派生 set 初始 owner 是当前学生/自学者，`Visibility=private`，不自动 publish/unlisted，不出现在 Community 搜索、收藏或排行榜。服务端验证 caller 能读取 source course revision 以及 objective/study item；客户端不能只提交一个猜出的 ID 请求派生。

### 5.2 重新同步

- 源条目发布新 `ContentVersion` 后，已有派生链接通过 source revision 比较显示“课程内容已更新”，保留旧记忆集继续练习。
- 学生点击“查看更新”先预览变更，不自动覆盖。
- 每个源 StudyItem 有稳定 ID/key。内容未变的行可保留其 MemoryItem 对照；若用户确认只更新 prompt/answer，保留其本人 TechniquePlan/PalaceBinding/PegBinding，不覆盖 `AssociationText`、`SceneText`、`SceneRecipe`、private asset references。
- 若源增删了行、顺序大变、或 memory item 已有个人手工编辑，默认创建新版本/新 MemorySet 并显示差异；旧 set 保留，不能静默重写用户内容。匹配到同一 source item 的绑定是否复制到新 set，应作为显式“保留联想”动作并且只复制到同一所有者的另一个 private set。
- source item 删除或撤销授权后，禁止继续获取源材料；已有私人副本采用保留/删除策略（第 8 节），不由公共查询反向泄露其来源。

### 5.3 XP、PracticeAttempt 与周榜

**[建议]** PracticeAttempt 可记录不含成绩的练习来源范围 `education-private`，以保留现有记忆练习/连续天数体验，但它不保存 AssessmentAttempt、grade、排名、熟练度证据或测评答案。现有练习 handler 会按回忆练习发通用 XP 并更新 streak（A7）；封闭课程如保留个人 XP/streak，必须在服务端明确排除该来源的 Community leaderboard 计分与社区奖励，并阻止该活动的公开分享。教育测评提交/评分/发布与教育课程浏览/bridge 点击不发 XP。

如果产品决定封闭模式不发任何 XP，需要单独确认是否也不更新个人 streak；不能通过往 XP 事件填入测评分数实现。不得用客户端设置/角色标记代替服务端来源范围。

### 5.4 谁可见个人 MemorySet

**[建议]** 派生的个人 MemorySet 默认只对 owner 可见，包括内容、练习历史、绑定、图片/场景。教师/课程作者默认只可见学生是否选择了桥接/汇总状态（若产品批准课程层汇总），看不到 prompt-answer 的个人编辑、联想、位置或媒体。监护人只看既有关系授权允许的任务和已发布成绩/报告；不得因此读取私有记忆集。若将来展示学习完成状态，另由学习者/监护人关系授权和年龄政策决定，不能从课程 link 授予。

用户删除课程 derived set 时软删除其 link 与 owned MemorySet，并清理仅它使用且可安全删除的个人媒体；共享课程源条目不因此删除。退班/撤销课程访问立即阻止同步源和读取教师课程资源；个人派生集是否保留由 owner 决定，默认保留为私有个人材料但不再提示源更新。正式已提交成绩按 Education 留存政策独立保存；解绑/退班不自动删除成绩或转换权限。媒体/附件清理需检查其是否仍被其他 MemorySet 引用。

## 6. 测评映射与界面流

### 6.1 最小映射

**[代码已确认]** 现有 `EducationQuestion.ObjectiveId` + `AssessmentId` 可聚合成知识点相关 assessment（A3）。**[建议]** 首期不加 Objective-to-Assessment 表；新建一个授权过滤 query：给指定 objective 取题目关联的 Assessment IDs，再按 assessment published/public-practice 或 assignment recipient/relationship 状态过滤。只有需要“无题题目也可推荐测评”时才增显式映射。

若一个 objective 关联多项 assessment：

- 课程知识点页显示可用且当前用户被授权的测评清单/数量，不猜最相关者；
- 练习结束页显示“验证这一知识点”，用户选择一项；
- 正式 assignment 显示任务自己的截止/作答规则，公开自主练习则明确标出不产生正式成绩；
- 学生查询 DTO 仅返回题目安全视图，答案键留在评分端。

### 6.2 屏幕与路由

| 步骤 | 屏幕 | 行为和跳转 |
|---|---|---|
| 1 | 课程/Unit/知识点详情 | 先看 study items、语言和记忆类型；入口“用记忆法学习”只在适配时出现；相关测评单独显示 |
| 2 | 选择方法 | Palace/Number Peg/继续普通学习；展示选择理由，不适用类型不强推 |
| 3 | 派生预览 | 展示当前发布的源学习条目，选复用方式并预览即将创建的 prompt/answer；不读取测评 key |
| 4 | 私人 MemorySet 生成/完善 | API 在服务器创建 owner-only set，回传 MemorySetId；用户建立/编辑本人联想、宫殿/数字桩绑定 |
| 5 | Palace/Number Peg 会话 | 复用现有 `[memorySetId]` 练习会话及断点行为；会话上下文标记 education-private |
| 6 | 桥接完成 | 展示普通练习完成、返回知识点、重新练习、选择相关 assessment；无映射时只回课程 |
| 7 | Education 测评/作答 | 正式 assignment 或允许的公开 practice 走各自既有 API/反馈规则 |

路由建议：教育来源入口用稳定 `courseId/objectiveId/revisionId`；记忆会话传新的 `MemorySetId` 与短期 bridge context。当前会话 `returnTo` 只允许少数 technique 首页，后续需增加经验证的教育 return context，而非信任任意 URL。服务端每次重取 course/objective/derived link；课程撤权、成员退出、revision 更新时清除/失效用户级缓存。正式 assessment 通过白名单 course/objective/assessment IDs 回到测评，不把成绩塞入路由或 `PracticeAttempt`。

## 7. 儿童补习中心封闭模式

### 7.1 内容和入口隔离

**[建议]** 机构当前关系模型虽有 Classroom/Membership/Guardian link，但本文不设计 Organization。未来 Organization 只能作为额外的资源分组/策略边界；仍需以当前课程、任课教师、active 学生和 guardian relationship 授权每一次读写，不能以组织 Admin 或平台 Admin 任意读取孩子数据。

封闭模式按 API 和 UI 双层屏蔽：

- Community tab、Discover MemorySets/公开课程目录、community weekly directory/detail 与 API。
- Community 收藏/复制/点赞/举报/分享和 public deep links / auth returnTo。
- 公开 MemorySet 预览与被分享的 Community 课程入口。
- 通过普通自学课程详情绕过当前分配/课程成员授权的资源访问。

机构学习只查询该课程已发布 study revision、被授权的教师 curated MemorySet 和当前学生本人 private derived MemorySet。缺少教师审核集时可按源条目派生个人集；若用户无权读取源课程则连派生 API 也必须拒绝。退班、到期、课程撤销后服务端查回拒绝并刷新私有缓存。Admin 身份不增加学生数据授权。外部 share summary 不包含课程/学生名、答案、成绩、联想、图片或其他班级信息。

### 7.2 XP/streak 建议

建议保留本人个人 streak 与基础 XP 作为记忆学习反馈，但 bridge 活动须标记来源并从 Community weekly scores/rewards 排除。封闭模式不提供查看/加入周榜入口；直接 API/deep-link 也须按服务端闭模式政策拒绝。教育成绩、assessment completion、正式 rank、mastery evidence 不触发 XP。连续天数只说明常规学习活动连续性，不是测评表现或掌握判定。

### 7.3 低年级体验验收（简短）

- 大触控目标、每屏少量阅读；关键说明用图示/短句，支持自选朗读，不默认录音或上传儿童声音。
- 方法选择和操作结果有图标+文字，颜色不是唯一反馈；失败可返回/重试，不丢源材料。
- 内容语言与 UI 语言分别配置；Chinese/English/Malay 条目不因 app locale 改变原文。

## 8. 方案比较与推荐

| 方案 | 内容/关系 | 存储成本 | 授权复杂度 | 封闭模式 | 迁移风险 |
|---|---|---:|---:|---|---:|
| A：现有单 FK 推荐 | Objective → 一个已公开 MemorySet | 低 | 低 | 差：公共可见资源限定，不支持按班级私有授权 | 低，但功能上限明显 |
| B：多 ID 关联清单 | Objective ↔ 已有 MemorySet，按用途/受众关联 | 低 | 中 | 中：必须建立课程/班级授权关联，不得修改现有可见性含义 | 中：需把旧 FK 转成关联记录 |
| C：每次完全新建个人 MemorySet | 从 syllabus 源内容每用户生成新集；用户 owned | 高（每用户存储一份题目/plan） | 中 | 好，但更新/课程撤回后的私人副本规则复杂 | 中；新流程重用现有 set 模型 |
| **B'：课程条目 → 按需派生个人集（推荐）** | 版本化授权学习条目；API 依据源 revision 服务端派生 owner-only MemorySet，记录 source IDs/version | 中；仅被使用的条目派生，按需增长 | 中高：派生/同步/撤权须逐次校验 | **最好**：不依赖 Community，学习者只拿自己拥有的 private set | 中高：需新增 study item/revision/link 与来源标记，但能复用 MemorySet 会话 |

推荐 B' 作为目标架构；Slice 0 先建学习条目及课程版本模型，再交付派生。保留 A 作为现有公开推荐兼容；不把 B' 变成新的通用资源权限框架。首期不需要 AI 生成：只把已批准 study items 映射到 MemoryItem，用户可在其私人 MemorySet 建立联想。若将来加模型生成，输出先进入私有草稿、用户审阅后保存，不能自动公开或变成标准答案。

## 9. 垂直切片重排

| 切片 | 迁移 | API | 前端 | 测试与独立验收 | 明确不做 | 完成后界面可见 |
|---|---|---|---|---|---|---|
| **0. 学习条目模型 + 作者编辑 + 导入（前置）** | CourseRevision、Unit（若确认需要）、StudyItem/Revision、媒体 ID 引用；不变更正式 attempt | 作者按课程所有权 CRUD；发布修订；JSON 导入 preview/commit；逐次读取权限 | Education 编辑器结构化字段、顺序、媒体选取、语言/审核状态；只在作者工作台 | owner 能新增/修改/预览；非 owner/无关系教师/Admin 无关系均拒绝读写；跨课媒体 ID 拒绝；错误/超限/重复 key 测试 | 不创建 MemorySet、不加学生个人记录、不引入 AI、不改已发布测评题 | 编辑课程时看 Unit→Knowledge point→Study items；能从 JSON 导入原创 demo 文件，预览错误和未审核状态 |
| **1. 按 B' 派生私人 MemorySet** | `EducationDerivedMemorySetLink` + source item link；MemorySet source activity scope | 鉴权 source revision，幂等生成、选 technique、获取/同步状态；只返回用户 own private MemorySet | 知识点页 CTA → 方法选择 → 素材预览 → 派生个人 set 编辑器 | active learner/公开学习者按 audience 成功；其他班/退班/无关/Admin 无关系拒绝；确认 ownerId、Visibility private、source version；无公开目录可见性 | 不写 grade/rank/mastery 到 PracticeAttempt/XP；不自动发布；不复制入 Education 私有联想 | 课程知识点下选择方法后看到自己的私有记忆集，可编辑自己的联想 |
| **2. Palace/Peg 练习和测评回程** | 只扩展练习来源上下文与安全返回状态（不新增成绩字段） | 练习会话验证 owner/source；返回上下文安全校验；assessment 列表使用现有 question ObjectiveId 映射 | 复用现有 Palace/Number Peg routes；完成页返回知识点并选择可用测评 | 实际 UI route 参数；对答案键 DTO 序列化断言；无测评/多测评/撤权/会话失败；assert 无 grade、mastery、rank 写入 practice/xp | 不改评分规则，不把 MemorySet 完成标为已掌握 | 练完看到“回课程 / 重练 / 验证知识点”，多个测评可选 |
| **3. 儿童封闭模式和清理策略** | 练习来源范围字段/索引，必要的课程资源 grant；不设计 Organization | 每次 course/resource/media/leaderboard 检查当前关系；closed activity 过滤 Community scoring/rewards；退出/撤权响应 | 教师/班级入口；隐藏 community tab/分享/deep links；低阅读/大按钮/可选朗读 | 矩阵覆盖 owner/当前教师/其他班教师/active/其他班/退班/verified/revoked guardian/stranger/Admin；直接 API、附件和 deep link 全测 | 不给 Admin 扩权；不屏蔽/改造无关社区产品；不调整其它模块权限 | 儿童只看到本课条目与自己的练习；无 Community、周榜、公开分享入口；提示个人更新但不泄露其他班 |

## 10. v1 待决问题的推荐答案与本版新增问题

### v1 的 5 个待决问题

1. **个人 MemorySet 谁可见？** 默认只 owner 可见。教师、作者和家长不看个人内容/联想/宫殿；如需课堂完成状态，另设计最小汇总，理由是保护儿童私人记忆材料。
2. **机构学习材料谁创建？** 第一版教师/作者编写并审核源条目；学生派生集留在个人空间，不自动提交老师审核，理由是减少私人内容回传和家校关系外泄。
3. **首期是否 AI 生成？** 不依赖 AI；先从作者明确批准的结构化条目确定性派生，理由是当前 Objective 无正文且要先验证内容质量/版权/答案边界。
4. **Objective 对应哪些测评？** 首期按已有 question ObjectiveId→AssessmentId 聚合；一 objective 多测评时让学习者选择，理由是最小变更并避免标题推测；若要关联无题测评再讨论显式映射表。
5. **记忆练习 XP 怎么办？** 保留与既有独立记忆练习相同的个人 XP/streak，但来源需可隔离并从 Community 排名/奖励排除；教育正式成绩/排名/掌握变化/桥接点击不新增 XP，理由是保留习惯激励但避免封闭儿童参与公共社交。

### v2 新增需产品确认

1. 第一版发布单元层级是否必须支持 Unit？建议支持轻量 `EducationUnit`，因种子文件和课程导航明确是 Course→Unit→Objective。
2. 内容 revision 与课程发布粒度是否采用“整门课程 immutable revision”？建议是，避免发布中混用新旧 StudyItem。
3. `verbatim-text` 作者原创概要和教材原文的差别如何提示？建议导入/编辑时声明授权和来源；演示内容只用原创概要，不复制受版权保护课文/古诗版本。
4. 个人 set 同步时是否允许保留旧 AssociationText？建议允许用户确认保留且只在同一 owner 私人 set 内复制，并对改动答案提示重看；默认不覆盖。
5. closed mode 是否保留私有 XP/streak？建议保留，但 bridge 来源从社区榜单/奖励和分享中完全排除；若不保留需明确是只关 XP 还是 XP 与 streak 都关。
6. 未审核条目是否允许作者本人预览？建议仅作者预览；未审核数据不得公开/分配给儿童作为可评估的正式 syllabus 内容。

## 11. 事实引用索引

Education 当前类型/权限/版本/answer key：`apps/api/src/MemoPal.Domain/Entities/EducationCourse.cs`、`EducationObjective.cs`、`EducationAssessment.cs`、`EducationQuestion.cs`、`apps/api/src/MemoPal.Infrastructure/Persistence/EducationQuestionConfiguration.cs`、`apps/api/src/MemoPal.Application/Features/Education/PublicLearning/Queries/GetEducationPublicCourseQuery.cs`。  
MemorySet 所有权、项、绑定、复用/复制：`apps/api/src/MemoPal.Domain/Entities/MemorySet.cs`、`MemoryItem.cs`、`TechniquePlan.cs`、`PalaceBinding.cs`、`PegBinding.cs`、`PalaceScene.cs`、`PalaceLocus.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`、`apps/api/src/MemoPal.Application/Features/CommunityMemorySets/Commands/CopyCommunityMemorySetCommand.cs`。  
现有记忆入口与路由：`apps/mobile/src/features/memory-hub/screens/PracticeScreen.tsx`、`apps/mobile/src/app/palaces/memory/[memorySetId].tsx`、`apps/mobile/src/app/number-peg/[memorySetId].tsx`、`apps/mobile/src/features/palace-scenes/screens/PalaceMemorySessionScreen.tsx`、`apps/mobile/src/features/number-peg/screens/NumberPegSessionScreen.tsx`。  
XP/周榜/社区路由：`apps/api/src/MemoPal.Application/Features/PracticeAttempts/Commands/CreatePracticeAttemptBatchCommand.cs`、`apps/api/src/MemoPal.Application/Features/Leaderboards/Queries/GetCurrentCommunityLeaderboardQuery.cs`、`apps/mobile/src/app/(tabs)/_layout.tsx`、`apps/mobile/src/features/library/screens/DiscoverMemorySetsScreen.tsx`、`apps/mobile/src/app/community/leaderboard.tsx`、`apps/mobile/src/app/community/leaderboard/community-weekly.tsx`。  
此前代码审计：`docs/education-audit-2026-10-25.md`；课程设计：`docs/education-assessment-plan.md`；实现状态：`docs/education-implementation-status.md`。

## 12. 2026-10-26 后端切片 0 实际状态

以下是已实现的代码事实，与前文“建议”方案区分：

- `EducationObjective` 已有 `MemoryContentType`、`LanguageCode`、`GradeCode`、`CurriculumCode`、`SubjectCode`、`ContentOrigin`、`ReviewStatus`；`EducationObjectiveStudyItem` 已有条目内容、稳定键、排序、状态、版本、作者/时间审计和公开保密确认审计。依据：`apps/api/src/MemoPal.Domain/Entities/EducationObjective.cs`、`EducationObjectiveStudyItem.cs`、`EducationCourse.cs`。
- 有一份独立迁移 `20261025165516_AddEducationObjectiveStudyItems`；旧 Objective 默认 `NotApplicable` / `Original` / `Unreviewed`，没有改动 `RecommendedMemorySetId`。依据：`apps/api/src/MemoPal.Infrastructure/Persistence/Migrations/20261025165516_AddEducationObjectiveStudyItems.cs`、`EducationAuthoringConfiguration.cs`。
- 作者 API 支持知识点元数据、条目列表/创建/批量导入/编辑/删除/排序/发布/撤回，以及 JSON/CSV 导入；学习者 API 支持课程 Objective 摘要、已发布条目与授权测评摘要。作者和学习者 DTO 分离。依据：`apps/api/src/MemoPal.Api/Controllers/EducationAuthoringController.cs`、`EducationPublicLearningController.cs`、`apps/api/src/MemoPal.Application/Features/Education/StudyItems/`、`Authoring/DTOs/EducationAuthoringDtos.cs`。
- 公开课程转公开与公开课程条目发布记录显式保密内容确认用户和 UTC 时间。条目读请求先核对课程未删除/未 moderation-hidden、owner/公开可发现状态，或 active classroom teacher/student 关系。课堂关系可由现有 assignment→assessment→course 链路或 `EducationClassroomCourse` 显式关联推导；后者使课程无需先布置作业也能供该班 active 成员学习。依据：`SetEducationCourseVisibility.cs`、`EducationStudyItemLearnerQueries.cs`、`EducationClassroomCourseCommands.cs`、`EducationAccess.cs`。
- 现有模型仍**没有 immutable EducationCourseRevision**；本切片只有 ObjectiveStudyItem `ContentVersion`。课程级发布快照、同步历史都未实现，不能把本切片视为完整课程版本系统。后续如引入课程 revision，应迁移条目/公开查询引用关系。
- 字符规范化使用 NFC 与 Unicode Rune 码点计数；UTF-8 CSV 可带 BOM，非 UTF-8 拒绝并提示另存为 UTF-8。媒体只接受 `media:<opaque-id>` 引用格式；本切片不上传媒体且学习者 DTO 不返回 MediaRef。拼音目前是条目字段，不做全文/拼音检索；后续应先对 `Phonetic` 做规范化/索引，定义声调/无声调查询策略，再决定支持包含匹配还是首字母匹配。
- 已验证测试：`apps/api/tests/MemoPal.UnitTests/EducationStudyItemTests.cs`、`apps/api/tests/MemoPal.IntegrationTests/EducationStudyItemEndpointsTests.cs`。完整验证结果记录在 `docs/education-implementation-status.md` 和 `docs/education-slice0-plan.md`。管理端/移动端作者 UI、课程 syllabus 导航和个人 MemorySet 派生均未实现。

## 13. 2026-10-26 授权和课堂关联加固状态

- **[已实现]** 新增 `EducationClassroomCourse` 作为显式多对多关联，含课堂/课程 ID、关联人、关联时间与软删除。active `(ClassroomId, CourseId)` 唯一；每门课可关联多班，每班可关联多门课程。迁移 `20261025172714_AddEducationClassroomCourses` 单独添加该表及外键/索引。依据：`apps/api/src/MemoPal.Domain/Entities/EducationClassroomCourse.cs`、`AppDbContext.cs`、`apps/api/src/MemoPal.Infrastructure/Persistence/Migrations/20261025172714_AddEducationClassroomCourses.cs`。
- **[已实现]** 关联和解除要求操作者既是课程 owner，也是课堂 owner 或 active teacher；班级课程列表允许该班 active teacher/student，课程关联班级列表仅课程 owner。关联后的课程材料访问与原 assignment→course 路径取并集，任一路径每次读取均重新验证 active membership。unlink 移除新路径，不改变既有 assignment 路径。没有修改 `EducationAccess` 方法语义，也没有 Admin 关系外授权。依据：`EducationClassroomCourseCommands.cs`、`EducationStudyItemLearnerQueries.cs`、`EducationAccess.cs`。
- **[已实现并修复]** 学习者 item endpoint 即使由课程 owner 请求也只返回 Published；知识点和班级课程摘要只统计 Published。课程不存在与无权访问使用完全相同的 404 body。CSV 导入先做 owner 授权再解析，不对其他用户公开字段/行错误。依据：`EducationStudyItemLearnerQueries.cs`、`EducationStudyItemCommands.cs`、测试 `EducationStudyItemEndpointsTests.cs`。
- **[尚未验证]** PostgreSQL 迁移往返测试已新增并要求变量 `MEMOPAL_CREDIT_TEST_CONNECTION`；本次变量未设置，因此没有运行 PostgreSQL 往返。InMemory integration 不证明 PG provider 上的 FK/index/type 行为。

## 14. 2026-10-26 按需派生后端实现（v2 补充）

本节记录代码确认事实；早期章节中“派生尚未实现”等时间点描述只反映其撰写时状态。

### 实体与创建

- **[代码已确认]** Education 侧新增 `EducationObjectiveDerivedMemorySet`，字段包括 ObjectiveId、MemorySetId、OwnerUserId、TechniqueKey、SourceContentHash、SourceItemCount、DerivedAtUtc、LastSyncedAtUtc；新增 `EducationDerivedItemMap` 记录 StudyItemId、MemoryItemId 和 LastSyncedContentHash。唯一索引仅约束未软删除行。没有修改 MemorySet/MemoryItem 实体或 `RecommendedMemorySetId`。路径：`apps/api/src/MemoPal.Domain/Entities/EducationObjectiveDerivedMemorySet.cs`、`apps/api/src/MemoPal.Infrastructure/Persistence/EducationDerivedMemoryConfiguration.cs`、`apps/api/src/MemoPal.Infrastructure/Persistence/Migrations/20261025184343_AddEducationObjectiveDerivedMemorySets.cs`。
- **[代码已确认]** 创建请求通过共享 `MemorySetCreation.BuildValidatedAsync`，最终调用既有 `MemorySetAggregate.Create`，复用私有可见性、folder、Palace、AI image 与聚合校验。初始状态是 Private/Draft，MemorySet 仍需学习者按已有界面配置 Palace locus/联想或 Peg 场景，之后进入原有练习流程；此接口不会自动生成个人联想。路径：`apps/api/src/MemoPal.Application/Features/MemorySets/Commands/CreateMemorySetCommand.cs`、`MemorySetAggregate.cs`、`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs`。
- **[代码已确认]** 删除 MemorySet 是软删除。为保持记忆功能对教育无感，记忆删除只发通用 `MemorySetSoftDeletingNotification`，Education 订阅者在同次保存中软删除 provenance 和 item maps；唯一索引过滤软删除行，用户可重新派生。路径：`apps/api/src/MemoPal.Application/Features/MemorySets/Commands/DeleteMemorySetCommand.cs`、`EducationMemoryBridgeHandlers.cs`、`EducationDerivedMemoryConfiguration.cs`。物理删除 FK cascade 是数据库兜底。

### API 与映射

- **[代码已确认]** `GET /v1/education/public/objectives/{objectiveId}/memory-bridge` 返回知识点记忆类型、Published 条目数、两种方法的适配/建议/原因码，以及仅当前用户自己的派生集 ID、isOutdated 和变化计数。
- **[代码已确认]** `POST /v1/education/public/objectives/{objectiveId}/memory-bridge/derive` 请求 `{ techniqueKey }`，返回 `memorySetId`、方法和 `alreadyExisted`；相同 Objective+Owner+Technique 重复请求返回同一有效关联。`POST /v1/education/public/objectives/{objectiveId}/memory-bridge/{techniqueKey}/sync` 由本人主动触发，返回新增、更新、跳过、来源移除计数与不含内容的状态明细。路径：`apps/api/src/MemoPal.Api/Controllers/EducationPublicLearningController.cs`、`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/`。
- **[代码已确认]** 所有桥接 handler 每次调用 `EducationStudyItemAccess.RequireReadAsync`，查询只含未删除 Published StudyItems；隐藏课程、退班/无关/其他班且无授权/Admin 无关系均使用既有 not-found 行为。匿名请求由 `[Authorize]` 阻止。派生状态 DTO 没有问题、答案键、StableKey、作者私有字段、媒体引用或联想内容。
- **[代码已确认]** 映射为 VocabularyPair/CategoryMembership/FormulaSymbols/LabelDiagram: Primary→Prompt、Secondary→Answer；LanguageItem: Prompt=Primary，Answer 固定标签格式拼音/释义，Hint 优先 Extra；OrderedList 与 VerbatimText 按源 Position 生成第 N 步/句段提示。ConceptUnderstanding、ReasoningProcedure、NotApplicable 返回 `NotSuitableForMemoryTechnique`。错误 `ApiResponse.Errors` 携带原因码：`NotSuitableForMemoryTechnique`、`NoPublishedItems`、`RequiredAnswerMissing`、`MappedFieldTooLong`、`TechniqueCapacityExceeded`、`MemorySetItemLimitExceeded`、`UnsupportedTechnique`。路径：`EducationMemoryDerivationRules.cs`、`ExceptionHandlingMiddleware.cs`。
- **[实现限制]** 学习条目层按 Unicode Rune 计数；既有 MemorySet aggregate 仍使用 .NET UTF-16 `string.Length` 限制 Prompt/Answer≤500。为不改现有不变量，桥接会在映射值超过任一既有长度边界时明确拒绝，不截断；补充码点字符中有 250 个补充平面字符就达到 500 UTF-16 单元上限。路径：`MemorySetAggregate.cs`、`EducationMemoryDerivationRules.cs`。
- **[代码已确认]** SHA-256 源哈希稳定按 Position/Id 排序，并规范 NFC、首尾空白、CRLF 与连续空白；每个 map 另保存实际派生 Prompt/Answer/Hint 的规范哈希。同步仅改仍匹配上次写入哈希的条目；用户改过的条目记 `skipped-user-edited`，来源已移除的条目保留，新增条目追加，超 100 项在保存前拒绝。同步不改 MemorySet/MemoryItem ID、TechniquePlan、PegBinding 或 PalaceBinding。实现路径：`EducationMemoryDerivationRules.cs`、`EducationMemoryBridgeHandlers.cs`。

### 验证结果与未验证项

- **[已测试]** 新增单元用例 14 项，覆盖八种支持类型、三种拒绝类型、哈希规范、长度与容量。API 集成新增 3 项，覆盖公开/课程所有者/课堂 active 学生、幂等、拒绝、隐藏/退班、私有内容、删除重建、更新/跳过/追加/保留已移除条目和副作用计数。测试文件：`apps/api/tests/MemoPal.UnitTests/EducationMemoryDerivationTests.cs`、`apps/api/tests/MemoPal.IntegrationTests/EducationStudyItemEndpointsTests.cs`。
- **[尚未验证]** 本机 `MEMOPAL_CREDIT_TEST_CONNECTION` 未设置；PostgreSQL 专用迁移往返测试跳过，因此 PG 实际 FK/索引/长度和 rollback 仍待运行验证。没有生产库迁移。
- **[尚未验证]** 整合测试的一次受控并行运行与单元测试同时通过；未复现先前注册阶段 HTTP 500。分开的 BaseOutputPath 仍共享默认 obj 中间产物，观测到一条 MSBuild 文件 copy 重试 warning；这不伴随注册 HTTP 500，尚不能认定为原问题根因。
- **[风险/建议]** 完成派生后仍是 Draft，现有移动端没有课程知识点进入桥接和自动配置 Memory Palace/Peg 场景的 UI；当前后端交付提供个人来源集，不等于完整的“打开课程后立刻记忆练习”体验。后续移动端可把派生集交给现有 setup flow。
- **[尚未实现]** 未新增 Education attempt/grade/mastery、PracticeAttempt、XP、连续天数写入；MemorySet 创建/同步本身无这些写入。个人 set 初始 Private 不在 Community 目录。现有 API 允许用户后来单独修改 MemorySet visibility；桥接没有更改这一既有能力，也未在本切片加禁止后续发布的记忆模块规则。
