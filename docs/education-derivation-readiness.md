# 按需派生后的“可直接练习”调查

日期：2026-10-26。本文是只读实现调查与后续设计，不代表相关 UX 已实现。

## 1. 当前从 Draft 到可练习的步骤

**[代码已确认]** 派生 handler 创建 Private/Draft MemorySet，且 TechniquePlan 为空：`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs`。Draft 不显示练习动作；详情页显示“继续设置”，把 `memorySetId`、版本、标题、GoalType 和条目传给对应作者屏：`apps/mobile/src/features/memory-sets/screens/MemorySetDetailScreen.tsx`。

**Memory Palace**

1. 用户进入 Palace composer，加载可用预设/个人 scene；需要选一个容量足够、可访问的 scene：`apps/mobile/src/features/palace-scenes/screens/PalaceMemoryComposerScreen.tsx`、`apps/api/src/MemoPal.Application/Features/PalaceScenes/Queries/GetPalaceScenesQuery.cs`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetPalaceValidator.cs`。
2. composer 按条目索引将项目放到 scene 对应 loci，并要求每项有一个唯一 locus 与非空 AssociationText；Ready 校验要求每项绑定：`apps/mobile/src/features/palace-scenes/screens/PalaceMemoryComposerScreen.tsx`、`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`。
3. 用户保存后才提交 `status=ready`、scene ID、locus 绑定与联想内容；宫殿选择和个人联想目前需要用户进入 composer 并保存。

**Number Peg**

1. 客户端 catalogue 用 1..100 作 peg number，按条目位置形成顺序：`apps/mobile/src/features/number-peg/utils/numberPegMap.ts`、`apps/mobile/src/features/number-peg/screens/NumberPegComposerScreen.tsx`。达到用户解锁数量时 composer 可按现有分块规则拆成多个集。
2. 每个 memory item 仍需 PegBinding，带唯一 1..100 PegNumber 与非空 SceneText；Ready 计划要求完整绑定：`apps/api/src/MemoPal.Application/Features/MemorySets/MemorySetAggregate.cs`。
3. 客户端可给出本地初始场景，也可让用户请求 AI 生成或修改建议；用户仍要经过 composer 保存 Ready 集：`apps/mobile/src/features/number-peg/screens/NumberPegComposerScreen.tsx`、`apps/mobile/src/features/number-peg/utils/numberPegMap.ts`。

**结论：** 两种方法都不是当前“派生后立即进入练习”的流程。Number Peg 的 peg 编号可按位置确定性分配；绑定记录、场景文字仍需保存。服务端能按既有字段创建绑定，但直接生成并保存 SceneText 会把系统写入当作学习者个人联想，不能作为无确认的自动化。

## 2. 预设场景、数据归属与封闭模式

- **[代码已确认]** `AdminBootstrapper` 创建一个 12 loci 的 `starter-memory-room`，并维护十个双语、每个十 loci 的公开系统模板；素材主要是房间和日常物件：`apps/api/src/MemoPal.Api/Security/AdminBootstrapper.cs`。模板 `UserId` 为空、由 system 审计字段维护；scene 为共享模板而不是学习者个人场景：`apps/api/src/MemoPal.Domain/Entities/PalaceScene.cs`。
- **[代码已确认]** owner/当前用户自己的 scene 与 Published template 会被 Palace scenes 列表读取；选中的公开模板关联在个人 TechniquePlan 上，个人 `AssociationText` 存在该用户 MemorySet 的 `PalaceBinding`：`apps/api/src/MemoPal.Application/Features/PalaceScenes/Queries/GetPalaceScenesQuery.cs`、`apps/api/src/MemoPal.Domain/Entities/PalaceBinding.cs`。
- **[尚未验证]** 预设室内场景有日常家具，儿童可理解性较好；没有查到针对特定年龄、地区文化、安全或无障碍的专门儿童审核状态。不要把“日常物品”当成教师/家长审定。
- **[代码已确认]** 12 loci starter scene 可自动提供 1–12 个位置；现有模板通常只有十个 loci，无法覆盖所有 100 项。超过所选场景容量时现有 composer 会要求换场景或拆分：`AdminBootstrapper.cs`、`apps/mobile/src/features/palace-scenes/screens/PalaceMemoryComposerScreen.tsx`。
- **[代码已确认]** `AdminBootstrapper` 在启动时，当 `AdminBootstrapOptions.Enabled`、`SeedGamificationMockData` 或 `SeedStarterContent` 任一启用时执行；其 bootstrap 内调用 `EnsureStarterPalaceSceneAsync` 与 `EnsurePredefinedPalaceScenesAsync`。场景不是单独可开关的一项；只有较宽的 Admin/bootstrap 或 starter-content 开关：`apps/api/src/MemoPal.Api/Program.cs`、`apps/api/src/MemoPal.Api/Security/AdminBootstrapper.cs`、`apps/api/src/MemoPal.Api/Security/AdminBootstrapOptions.cs`。
- **[代码已确认]** Palace/Number Peg composer 代码没有直接导航到 Community 的链接；但这不构成全应用封闭模式：全局 Community 路由/API 仍存在，封闭模式必须在产品壳层和服务端处理，不可只依赖 composer 不展示链接：`apps/mobile/src/features/palace-scenes/screens/PalaceMemoryComposerScreen.tsx`、`apps/mobile/src/features/number-peg/screens/NumberPegComposerScreen.tsx`、`apps/mobile/src/app/community`、`apps/api/src/MemoPal.Api/Controllers/CommunityMemorySetsController.cs`。

## 3. 联想的现状与保护原则

- **[代码已确认]** Palace composer 有本地 `createPalaceAssociation` 生成的默认候选，也允许请求 AI 联想建议；AI 结果先放入当前屏幕编辑状态，用户保存 MemorySet 时写入 PalaceBinding：`apps/mobile/src/features/palace-scenes/screens/PalaceMemoryComposerScreen.tsx`、对应 API `apps/api/src/MemoPal.Api/Controllers/PalaceAssociationsController.cs`。
- **[代码已确认]** Number Peg composer 由 `buildInitialSceneCandidates` 填充初始可编辑场景，也支持显式请求 AI story suggestions；最终 `sceneText` 在用户保存 Ready 集时写入 PegBinding：`apps/mobile/src/features/number-peg/screens/NumberPegComposerScreen.tsx`、`apps/mobile/src/features/number-peg/utils/numberPegMap.ts`。
- **[建议 / 约束]** 桥接不得在后台自动写入个人 AssociationText/SceneText。候选应显示为尚未接受的预览；用户逐条接受或明确接受整组建议后，才允许随 Ready 保存。重新同步教育源内容时不得覆盖这些字段，也不得删除 Palace/Peg 绑定。

## 4. 三个方案

| 方案 | 做法 | 迁移 / API / 测试 | 优点 | 风险与联想保护 |
|---|---|---|---|---|
| A. 服务端自动挂载默认场景/挂钩 |派生时选系统 scene、按顺序放入 loci/peg，并立即准备练习 | 可复用现有 TechniquePlan/Binding，无必需迁移；派生 API 需选择/回退 scene，验证场景可用性、容量、解锁；测试并发、场景容量、private owner 与撤权 | 接近一步开练；Number Peg 排序稳定 | Palace 超 12 项仍需选择/分集；自动写 SceneText/AssociationText 违反个人联想边界。除非只写空的结构绑定且 UI 不把其标成已接受联想，否则不推荐直接 Ready |
| B. 移动端引导设置向导 | 派生后保留 Draft；用户选 Palace scene / peg 映射，接受或编辑建议，再保存 Ready | 主要是移动端；API 可继续复用 MemorySet GET/PUT；补 UI 与完整端到端、撤权后编辑/练习、绑定持久化测试 | 用户控制清楚，最符合现有聚合校验和私人联想模型 | 多一步操作；大条目集需要分屏或拆分。联想候选在接受前只在客户端预览 |
| C. 混合：自动确定结构，用户确认个性化 | 服务端派生后可给 Palace 提供共享 starter scene 和按位置空绑定；Number Peg 预分配 peg number；客户端向导预览地点/挂钩，并把系统/AI 联想作为可选候选，用户确认后一次保存 Ready | 首期可不迁移，若要审计“用户接受某候选”可增 acceptance source/version 字段；API 增 prepare/accept 契约，或明确复用现有 PUT；测试默认 scene 不越权、超容量回退、未接受候选不入库、source sync 不触碰绑定 | 减少重复选择，保留学习者最终控制 | 首屏逻辑与边界稍复杂；需区分“结构分配”和“个人联想”两类状态；不能把空/系统建议冒充为已接受联想 |

**建议：先做 B 的最小向导，然后按 C 增加安全的结构预填。** 这确保从课程来的条目可直接打开设置入口，但需要由学习者确认联想后才开始练习。A 可作为后续产品实验：只允许自动确定 peg/locus 结构，不能静默写个人联想。方案不改变教育成绩、掌握证据与 XP/PracticeAttempt 的边界，也不新增教师对个人 MemorySet 内容的访问权。

## 5. 相关事实的边界

**[代码已确认]** MemorySet 创建/派生本身没有调用 practice、XP、streak、milestone 或通知 handler；XP/streak 更新位于 PracticeAttempt 批量提交；milestone 达成记录由 milestone 查询路径惰性建立：`apps/api/src/MemoPal.Application/Features/MemorySets/Commands/CreateMemorySetCommand.cs`、`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs`、`apps/api/src/MemoPal.Application/Features/PracticeAttempts/Commands/CreatePracticeAttemptBatchCommand.cs`、`apps/api/src/MemoPal.Application/Features/Milestones/Queries/GetMilestonesQuery.cs`、`GetMilestoneQuery.cs`。因此 Draft 派生集不会因为创建本身发 XP/成就/连续天数或通知；之后用户主动练习则沿用普通自主练习规则。

**[尚未验证]** 没有对生产消息总线、部署内自定义数据库拦截器或移动端封闭模式运行态做动态审计；以上副作用判断限于仓库代码路径和已有测试。

## 6. 封闭模式限制（Restricted Learner 服务端执行层，2026-10-26）

- **[代码已确认]** 账号增加 `AccountMode=Standard/RestrictedLearner`，默认 Standard；仅 Standard 平台 Admin 可调用受保护的标记设置接口，原因、操作者、对象和 UTC 时间入审计，响应仅成功布尔值。登录/当前用户响应中的 accountMode 来自服务端。后续机构账号创建流程可设置它，本次未实现 Organization 或学员开户。路径：`apps/api/src/MemoPal.Domain/Entities/User.cs`、`apps/api/src/MemoPal.Application/Features/Users/Commands/SetAccountModeCommand.cs`、`apps/api/src/MemoPal.Api/Controllers/AdminUsersController.cs`、`apps/api/src/MemoPal.Application/Common/Mapping/MapsterRegistration.cs`。
- **[代码已确认]** 全局 `RestrictedLearnerFilter` 每次认证请求读取数据库，无 account-mode JWT claim 或缓存；只有动作明确标注 Allow/Conditional 才可用，未标注默认拒绝。Community MemorySet、周榜、公开课程目录/详情/练习/收藏/历史、转介绍、作者/管理操作均拒绝。完整 243 动作分类见 `docs/education-restricted-learner-plan.md`；实现：`apps/api/src/MemoPal.Api/Security/RestrictedLearnerFilter.cs`、`RestrictedLearnerAttribute.cs`、`apps/api/src/MemoPal.Api/Program.cs`。
- **[代码已确认]** 学习条目和 memory-bridge 的 RestrictedLearner 只能用当前 active 课堂关系，经 assignment 或课堂-课程关联授权；课程公开或本人是课程 owner 均不能代替课堂关系。退班后来源读取/状态/派生/同步拒绝，但个人派生集仍可由本人读取。只读 Published、测评摘要按课堂可见范围过滤。路径：`apps/api/src/MemoPal.Application/Features/Education/StudyItems/EducationLearnerReadPolicy.cs`、`EducationStudyItemLearnerQueries.cs`、`apps/api/src/MemoPal.Application/Features/Education/MemoryBridge/EducationMemoryBridgeHandlers.cs`。
- **[代码已确认]** 本人 MemorySet/folder、普通练习、个人 Palace 与平台预设、Number Peg 配置仍按原 owner/解锁校验可用。创建、编辑与可见性接口拒绝非 Private；旧非私有集立即从 Community 查询隐藏，不静默批量修改；另有显式、带审计的 Admin 单集转 Private 操作。路径：`apps/api/src/MemoPal.Application/Common/AccountRestrictions.cs`、`Features/MemorySets/Commands/CreateMemorySetCommand.cs`、`UpdateMemorySetCommand.cs`、`Features/CommunityMemorySets/Commands/UpdateMemorySetVisibilityCommand.cs`、`Queries/GetCommunityMemorySetQuery.cs`、`GetCommunityMemorySetsQuery.cs`。
- **[代码已确认]** 外部 AI 的 Palace association、Number Peg story/image generation 拒绝；已完成的本人私有图片仍按 owner 校验可读，读取不调用 provider；已排队图片任务也按当前模式过滤，并在发送前重查。公开图片上传（Media/Auth avatar）拒绝，因为现有存储通过静态公开 URL 提供；不是私有上传接口。仍可使用本地候选并由本人编辑和确认联想，不会自动写个人联想。路径：`apps/api/src/MemoPal.Api/Controllers/PalaceAssociationsController.cs`、`NumberPegStoriesController.cs`、`AiCreditsController.cs`、`MediaController.cs`、`AuthController.cs`、`apps/api/src/MemoPal.Infrastructure/AI/AiImageWorker.cs`、`Program.cs`。
- **[代码已确认]** 普通自主练习保留原个人 XP/streak 规则；周榜行、人数、名次、奖励计算及热门复制/有用数排除受限账号。教育成绩仍未写入 PracticeAttempt/XP。教育课堂化名榜保留原教师开关和学生发布前 opt-in，受限状态本身不修改该同意机制。路径：`Features/PracticeAttempts/Commands/CreatePracticeAttemptBatchCommand.cs`、`Features/Leaderboards/Queries/GetCurrentCommunityLeaderboardQuery.cs`、`Commands/ProcessLeaderboardRewardsCommand.cs`、`Features/Education/Assignments/Commands/PublishEducationAssignmentResultsCommand.cs`、`UpdateEducationLeaderboardPreferenceCommand.cs`（均在 `apps/api/src/MemoPal.Application/`）。**[建议]** 儿童课堂继续保持教师和学生两项默认关闭。
- **[测试已覆盖]** `apps/api/tests/MemoPal.UnitTests/EducationMemoryTechniqueMatrixTests.cs` 的 22 个类型 × 方法组合固定当前 IsAllowed/IsRecommended；`RestrictedLearnerPolicyTests.cs` 固定默认值和分类完整性。`apps/api/tests/MemoPal.IntegrationTests/RestrictedLearnerEndpointsTests.cs` 覆盖即时切换、课堂/作业两路径、公开路径拒绝和退班；`RestrictedLearnerBackgroundTests.cs` 覆盖旧排队任务不调用外部 provider。
- **[代码已确认]** 本人答卷/附件额外限定本人，既有教师/监护关系不扩大学员附件权限；作者/监护人创建任务列表拒绝，学生使用 my/assignments。路径：`apps/api/src/MemoPal.Application/Features/Education/StudyItems/EducationLearnerReadPolicy.cs`、`apps/api/src/MemoPal.Api/Controllers/EducationAssignmentsController.cs`。
- **[尚未验证 / 边界]** 本次没有移动端入口与错误态的真机适配；全局 Community 页面仍存在，服务端拒绝不能代替后续 UI 适配。历史公开媒体 URL、已下载副本、远程缓存和已开始的外发请求不能靠标记撤回；静态文件不是 Controller 动作。真实 PostgreSQL 仅在提供测试连接环境变量后验证，未设置时不声称通过。
