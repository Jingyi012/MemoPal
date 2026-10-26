# 教育模块审计（2026-10-25）

**范围：只读代码与仓库历史审计。** 本报告未修改应用代码。当前工作区在审计开始前已有大量非教育模块改动；教育模块文件在 `git status` 中没有未提交源码变更。此次新报告及后续状态文档审计注记除外。

事实按以下标记区分：
- **[代码已确认]**：由当前代码、路由、模型、测试或 Git 记录直接支持；每项附路径。
- **[尚未验证]**：代码有实现，但未真实运行完整产品路径/设备/部署。
- **[建议]**：本次审计的分类或解释，不是产品决定。

## 已实现且有测试

### 1. 2026-10-01 之后的教育相关 Git 变更

**[代码已确认]** 对 `apps/mobile/src/features/education/`、教育路由、`apps/admin/src/features/education/`、API Education 功能域和教育状态/规划文档执行 `git log --since="2026-10-01" --all`，识别到两笔直接触及教育代码的提交：

| 提交 | 功能分组 | 提交实际触及内容 |
|---|---|---|
| `81fa6c17`（2026-10-19，标题为 leaderboard/share） | 教育功能垂直切片的提交快照 | 新增/纳入 Education Portal 页面、管理端 API 与类型；教育后端 Authoring、Relationships、Assignments、Attempts、PublicLearning、Family、Progress、Admin 域和控制器；移动端教育路由、课程目录/详情/公开练习、家庭报告、任务/答题器、题型输入和 API/hooks；教育数据库迁移、单元/集成测试；教育实现状态和规划文档。虽然提交标题不是教育，diff 对教育路径包含完整的大量文件添加。证据：`git show --stat 81fa6c17`、`git show --numstat 81fa6c17 -- apps/mobile/src/features/education apps/admin/src/features/education apps/api/src/MemoPal.Application/Features/Education docs/education-implementation-status.md`。 |
| `82b60bf5`（2026-10-20，replace AnimatedPressable with AppButton） | 教育答题/练习 UI 改动 | 修改移动端 `EducationAssignmentPlayer.tsx` 和 `EducationPracticeReview.tsx` 的交互按钮，并同一提交中修改 Home 与 Community Discover UI。此提交是按钮组件替换/界面调整，不是新增教育领域流程。证据：`git show --stat 82b60bf5 -- apps/mobile/src/features/education apps/mobile/src/features/home/screens/HomeScreen.tsx apps/mobile/src/features/library/screens/DiscoverMemorySetsScreen.tsx`。 |

**[代码已确认]** Git 当前分支列出的 2026-10-01 后教育路径变更只看到以上两笔；教育功能本体的大量代码在 10 月 19 日单个提交中落入历史，不能仅凭提交标题将其解释为单独新增的排行榜功能。审计时没有发现教育源码未提交 diff。工作区存在其他未提交更改，例如 Companion、Memory Hub、Profile 和登录等，未归入本次教育改动。证据：`git status --short`；前述两个 commit 的 path-limited log/show。

**[建议]** 如需追溯教育模块每项功能最初的实现时间，应进一步查看 `81fa6c17` 的父提交及完整逐文件 diff；在当前 Git 历史里，10 月 19 日的提交对教育实现是一个聚合快照，不宜把它误写成每项功能分别于该日设计或开发。

### 2. Community 公开课程与公开练习

**[代码已确认]** 移动端 Community Discover 有学习入口，路由到 `/community/education`；登录用户可从目录进入课程详情，再进入具体公开自主练习。对应路径：

- `apps/mobile/src/features/library/screens/DiscoverMemorySetsScreen.tsx`
- `apps/mobile/src/app/community/education/index.tsx`
- `apps/mobile/src/app/community/education/[courseId]/index.tsx`
- `apps/mobile/src/app/community/education/[courseId]/[assessmentId].tsx`
- `apps/mobile/src/features/education/screens/EducationPublicCoursesScreen.tsx`
- `apps/mobile/src/features/education/screens/EducationPublicCourseScreen.tsx`
- `apps/mobile/src/features/education/screens/EducationPublicPracticeScreen.tsx`

**[代码已确认]** 后端要求课程本身已公开、未被管理员隐藏；只暴露已发布并显式允许公开练习的客观题 Assessment。学生公开练习 DTO 不发答案键，答题后服务器检查并返回正确性/解释；个人历史记录只保存课程/题目引用、最近时间和最近正确性，不把原始答案或正式成绩写进去。课程撤下/隐藏会撤销目录和练习访问。路径：

- `apps/api/src/MemoPal.Api/Controllers/EducationPublicLearningController.cs`
- `apps/api/src/MemoPal.Application/Features/Education/PublicLearning/Queries/GetEducationPublicCoursesQuery.cs`
- `apps/api/src/MemoPal.Application/Features/Education/PublicLearning/Queries/GetEducationPublicCourseQuery.cs`
- `apps/api/src/MemoPal.Application/Features/Education/PublicLearning/Queries/GetEducationPublicPracticeAssessmentQuery.cs`
- `apps/api/src/MemoPal.Application/Features/Education/PublicLearning/Commands/CheckEducationPublicPracticeAnswerCommand.cs`
- `apps/api/src/MemoPal.Application/Features/Education/PublicLearning/Queries/GetEducationPublicPracticeHistoryQuery.cs`

**[代码已确认]** API 集成测试覆盖公开资源隔离/撤销、保存和历史用户隔离、无正式 attempt 副作用、答案安全投影、举报与隐藏，以及课程知识点推荐可发现 MemorySet。路径：`apps/api/tests/MemoPal.IntegrationTests/EducationPublicLearningEndpointsTests.cs`。

**结论：[建议] 能走通（有前置条件）。** 普通的已登录账号可以作为学习者走完“Community → 已发布公开课程 → 允许公开练习的测评 → 作答/查看反馈”。但访客未登录不能进入主 Tabs（`apps/mobile/src/app/(tabs)/_layout.tsx`）；必须存在公开课程和公开练习测评，作者还要分别公开课程及勾选 Assessment 的公开自主练习；公开题只适合练习，不是保密考试。此结论由路由与 API 代码支持，**本次没有启动手机 App 实际点击全流程**。

### 3. 教师课程/测评、课堂作业、学生作答与发布

**[代码已确认]** 任意已认证账号可创建个人课程；课程页可建 Objective、Assessment；Assessment 可编辑题目、预览并发布。公开课程与 Assessment 的公开自主练习是分别控制的，默认未将课堂题目公开。路径：

- `apps/admin/src/App.tsx`
- `apps/admin/src/features/education/pages/EducationCoursesPage.tsx`
- `apps/admin/src/features/education/pages/EducationCoursePage.tsx`
- `apps/admin/src/features/education/pages/EducationAssessmentPage.tsx`
- `apps/api/src/MemoPal.Application/Features/Education/Authoring/Commands/CreateCourse.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Authoring/Commands/PublishAssessment.cs`

**[代码已确认]** 课堂 Owner 可以邀请教师/学生；学生接受后可成为 active member。教师/Owner 可以把已发布 Assessment 分配给当前 active 学生，系统保存接收者快照。学生端 `/education/assignments` 有任务列表、开始/恢复、答题器和提交流程；后台成绩册支持人工批改、显式发布结果、成绩更正和授权补测。路径：

- `apps/admin/src/features/education/pages/EducationHomePage.tsx`
- `apps/admin/src/features/education/pages/ClassroomDetailPage.tsx`
- `apps/admin/src/features/education/components/RelationshipForms.tsx`
- `apps/admin/src/features/education/components/ClassroomAssignments.tsx`
- `apps/admin/src/features/education/components/EducationAssignmentGradebook.tsx`
- `apps/mobile/src/app/education/assignments.tsx`
- `apps/mobile/src/features/education/screens/EducationAssignmentsScreen.tsx`
- `apps/mobile/src/features/education/components/EducationAssignmentPlayer.tsx`
- `apps/api/src/MemoPal.Application/Features/Education/Assignments/Commands/CreateClassroomAssignmentCommand.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Attempts/Commands/SubmitEducationAssessmentAttemptCommand.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Assignments/Commands/PublishEducationAssignmentResultsCommand.cs`

**[代码已确认]** 教师不是全局 Admin 特权的同义词。课堂成员、课程所有者、当前家庭链接及任务接收人范围由教育功能域服务端检查；当前实现以 active classroom membership、课程 UserId 和 verified guardian link 做访问边界。学生试卷 DTO 是另一个无答案键的投影。路径：

- `apps/api/src/MemoPal.Application/Features/Education/Relationships/EducationAccess.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Authoring/Queries/GetAssessment.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Attempts/EducationAttemptMapping.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Assignments/Queries/GetEducationAssignmentGradebookQuery.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Assignments/Queries/GetEducationAssignmentLeaderboardQuery.cs`

**[代码已确认]** 集成测试覆盖学生尝试所有权/答案键隐藏、不可分配草稿或非成员、同一发布 Assessment 分配、监护人家庭作业范围、已发布结果/榜单、人工评分授权与关系流程。代表性路径：

- `apps/api/tests/MemoPal.IntegrationTests/EducationAssessmentAttemptEndpointsTests.cs`
- `apps/api/tests/MemoPal.IntegrationTests/EducationAssignmentEndpointsTests.cs`
- `apps/api/tests/MemoPal.IntegrationTests/EducationRelationshipEndpointsTests.cs`
- `apps/api/tests/MemoPal.UnitTests/EducationAssignmentTests.cs`
- `apps/api/tests/MemoPal.UnitTests/EducationRelationshipTests.cs`

**结论：[建议] 能走通（需要至少一个教师/Owner 和一个 active 学生账号，并且学生答题在 MemoPal 移动端完成）。** 从管理 Portal 建课程/测评、创建课堂、邀请并等待学生接受、布置已发布 Assessment，到学生手机端提交，再到 Portal 成绩册人工批改/发布，代码和 API 有完整组成。它不是单个普通账号无需关系就能完成的自包含旅程：需要两方有效成员关系；而已确认没有完整桌面 Web 学生答题器，Portal 的学生卡片将用户导到移动 App。路径：`apps/admin/src/features/education/pages/EducationHomePage.tsx`、`apps/admin/src/features/education/components/ClassroomAssignments.tsx`、`apps/mobile/src/features/education/screens/EducationAssignmentsScreen.tsx`。

**[尚未验证]** 此判断是代码路径审阅，不是浏览器/手机上的真实端到端演练。面向开放题，需先人工评分完毕才能发布分数；客观题可服务端自动评分。

### 4. 知识点/课程到 Memory Palace / Number Peg 的连接

**[代码已确认] 存在连接，不应写“没有”。** 数据层的 `EducationObjective.RecommendedMemorySetId` 连接到 `MemorySet`；管理端推荐选择器只列出公开且可发现的 MemorySet，并显示 technique。公开课程详情 DTO 查询当前仍可发现的 MemorySet，并带回 `techniqueKey`。路径：

- `apps/api/src/MemoPal.Domain/Entities/EducationObjective.cs`
- `apps/api/src/MemoPal.Infrastructure/Persistence/EducationObjectiveConfiguration.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Authoring/Commands/SetEducationObjectiveMemoryRecommendation.cs`
- `apps/api/src/MemoPal.Application/Features/Education/Authoring/AuthoringValidation.cs`
- `apps/api/src/MemoPal.Application/Features/Education/PublicLearning/Queries/GetEducationPublicCourseQuery.cs`
- `apps/admin/src/features/education/components/EducationObjectiveMemoryRecommendationEditor.tsx`
- `apps/admin/src/features/education/components/EducationResourceCreateButton.tsx`
- `apps/mobile/src/features/education/types/educationPractice.types.ts`
- `apps/mobile/src/features/education/screens/EducationPublicCourseScreen.tsx`

**[代码已确认]** Portal 写入连接时由后端验证推荐集仍可推荐；前端显示“Memory Palace”或“Number Peg”。学习者在课程详情点推荐集后进入 `/community/memory-sets/:id`。对应 Community 详情显示记忆技巧、预览记忆项、支持复制到个人 Library；用户可以再从既有 Memory Palace/Number Peg 模块使用该复制集。路径：

- `apps/mobile/src/features/library/screens/PublicMemorySetDetailScreen.tsx`
- `apps/mobile/src/app/community/memory-sets/[memorySetId].tsx`
- `apps/mobile/src/features/number-peg/screens/NumberPegHomeScreen.tsx`
- `apps/mobile/src/features/palace-scenes/screens/PalaceHomeScreen.tsx`
- `apps/mobile/src/app/number-peg/[memorySetId].tsx`
- `apps/mobile/src/app/palaces/memory/[memorySetId].tsx`

**结论：[建议] 部分实现。** 有课程目标 → 公开 MemorySet 的数据/UI/Community 路由连接，也显示 Palace/Number Peg 技巧类型；但教育目标没有直接启动一段 Palace/Number Peg 练习的专用路由或进度回链。当前是“推荐 → Community 详情/可复制 → 用户再进入既有记忆模块”的链接，不是课程内嵌记忆练习闭环。

**[代码已确认] 测试：** `EducationPublicLearningEndpointsTests.Public_course_recommends_only_currently_discoverable_memory_sets` 覆盖私有集拒绝、公开可推荐、公开 DTO 返回 technique、作者可清除/更新、变私有后详情不再展示。前端选择器/链接目前未见相应 UI 路由自动化测试。测试文件：`apps/api/tests/MemoPal.IntegrationTests/EducationPublicLearningEndpointsTests.cs`；现有 admin 测试：`apps/admin/src/features/education/utils/educationQuestionPreview.test.ts`、`educationQuestionForm.test.ts`、`educationWorkspaceCapabilities.test.ts`。

## 已实现无测试

**[代码已确认]** 以下 UI/交互有实现代码，但本次搜到的测试主要验证纯函数和 API 集成，没有覆盖完整页面导航/渲染到交互的端到端测试：

- Community 目录、课程详情的搜索/收藏/举报/分享按钮和路由串联：`apps/mobile/src/features/education/screens/EducationPublicCoursesScreen.tsx`、`EducationPublicCourseScreen.tsx`。
- 教师端课程 → Assessment 编辑页 → 班级创建/成员邀请 → 作业面板 → 成绩册的真实 UI 旅程：`apps/admin/src/features/education/pages/`、`apps/admin/src/features/education/components/`。
- 从课程目标推荐卡到 Community MemorySet 详情，再到用户自行进入 Palace/Number Peg 的跨模块体验：`apps/mobile/src/features/education/screens/EducationPublicCourseScreen.tsx`、`apps/mobile/src/features/library/screens/PublicMemorySetDetailScreen.tsx`。
- 桌面浏览器完整教师/学生联合流程、手机真实设备录音/回放/照片/弱网恢复：仓库状态文档明确未覆盖真实 iOS/Android 与浏览器 UX：`docs/education-implementation-status.md`。

**[尚未验证]** “未找到 UI 测试”只表示在本次检查的 Education 测试目录/文件中未发现覆盖相应旅程的 UI 级测试，不代表仓库所有测试完全没有间接触及。

## 部分实现

### 路径结论

| 路径 | 分类 | 断点/条件 |
|---|---|---|
| a. Community → 公开课程 → 做公开练习 | **能走通**（已登录，存在公开课程和明确开放公开练习的测评） | 游客不能使用认证 Tabs；内容须先由作者创建/发布；未真实启动 App 验证。移动路由和 API 测试存在。 |
| b. 教师建课程/测评 → 布置到班级 → 学生作答 → 批改 → 发布 | **能走通**（需要教师/Owner + 已接受邀请的学生；学生端需 MemoPal 手机 App） | 桌面 Portal 不是学生答题器；开放题结果必须完成人工批改才能发布；未做浏览器/设备 E2E。 |
| c. 课程知识点 → 推荐 MemorySet → 用记忆法练习 | **部分** | 推荐和连接真实存在；用户能打开/复制 Community 集合，也能使用现有 Palace/Number Peg 模块；但从课程知识点没有直接进入相应记忆练习的连续学习路由/自动返回联动。 |

### 权限和跨用户测试薄弱处

**已有覆盖（事实）：**

- 学生只能读自己的 attempt，学生 DTO 不暴露答案键：`EducationAssessmentAttemptEndpointsTests.StudentStartsSavesSubmitsAndCannotReadOtherStudentsAttemptOrAnswerKey`。
- 拒绝草稿/非成员分配；课堂分配的 owner/teacher/student 规则有单元与集成测试：`EducationAssignmentEndpointsTests.Cannot_assign_draft_assessment_or_nonmember_student`、`EducationAssignmentTests.ClassroomAssignmentRejectsNonTeacherNonStudentDraftAndDuplicateTargets`。
- 家庭作业要求 verified guardian；关系需双方确认/管理员核验，支持撤销：`EducationAssignmentTests.FamilyAssignmentRequiresVerifiedGuardianAndStudentQueryDoesNotExposeAnswerFields`、`EducationRelationshipTests.GuardianAccessRequiresBothConfirmationAndAdminVerificationAndEitherPartyCanRevoke`。
- 关系 API 有未授权访问、非目标用户不能接受/撤销、只有 Admin 可查待核验关系的测试：`EducationRelationshipEndpointsTests.cs`。
- Public practice 的 saved state/history 跨用户隔离、公开课程撤下撤权、举报管理只允许 Admin：`EducationPublicLearningEndpointsTests.cs`。
- 排名以匿名别名行并要求同意，结果发布/更正处理有端点覆盖：`EducationAssessmentAttemptEndpointsTests.StudentLeaderboardUsesFrozenPseudonymousRowsAndPerStudentConsent`、`EducationAssignmentEndpointsTests.Student_leaderboard_shows_only_own_rank_for_published_classroom_results`。

**薄弱/未找到直接覆盖的情形（测试目录审阅结论）：**

- 未找到专门断言“平台 Admin 角色本身不能读取无关系班级的学生名单、attempt、答卷/附件或 gradebook”的跨班级矩阵测试。业务代码中 Admin 不应替代关系授权；此处是测试缺口陈述，不是断言代码已存在漏洞。需看 `EducationAccess.cs`、各 Query Handler 与 `EducationAttemptsController.cs`。
- 未找到系统性矩阵测试覆盖：非所属作者读取/编辑每一种课程、目标、Assessment；不同课堂的 teacher/member 互读；学生 A 访问学生 B 的所有家庭报告/作业/成绩端点；撤销成员关系后对既有 attempt、附件、报表和缓存逐项立即失效。
- Attachment 专用测试主要有单元测试孤儿清理和 attempt 集成流程；未从当前测试列表确认所有四方身份（学生本人、当前教师、已验证监护人、无关第三方/Admin）对每一种 photo/audio attachment endpoint 都有正反例。相关文件：`EducationAssessmentAttemptEndpointsTests.cs`、`EducationAttachmentOrphanCleanupWorkerTests.cs`、`EducationAttemptsController.cs`。
- 成绩更正、撤销/重发、补测对跨用户缓存和每个报告 projection 的负向隔离覆盖分散，尚非统一的访问矩阵。
- 没有发现真实 PostgreSQL 测试在本次最新验证中执行；此前文档称 1 个 environment-gated PostgreSQL 测试跳过。因此 EF provider/事务/迁移行为的当前环境覆盖较弱。

**[建议]** 上述项目是“测试覆盖没有搜到/不够系统”，不代表代码权限已绕过。不得仅因测试缺口修改或放宽访问逻辑；如后续获授权实现，只应补审计测试后依据反例修代码。

### 种子数据、示例课程和 fixtures

**[代码已确认]** 启动时的 `AdminBootstrapper` seeds leaderboard、gamification、avatar/companion settings，以及可选预设记忆课程/宫殿场景；未发现 EducationCourse、Objective、Assessment 或课程题目 seed。`AppDbContext` 有教育 DbSet 和配置，但检索未发现 `HasData(...)` 教育种子。路径：

- `apps/api/src/MemoPal.Api/Security/AdminBootstrapper.cs`
- `apps/api/src/MemoPal.Api/Program.cs`
- `apps/api/src/MemoPal.Infrastructure/Persistence/AppDbContext.cs`

**[代码已确认]** 教育样例数据是在测试中临时构造/插入，不是可供开发/生产用户浏览的种子课程：

- `apps/api/tests/MemoPal.IntegrationTests/Fixtures/CustomWebApplicationFactory.cs`：为每个测试实例设置独立的 InMemory database 名称；
- `apps/api/tests/MemoPal.IntegrationTests/EducationPublicLearningEndpointsTests.cs`：运行时创建 “Public biology”“Cells and memory”等测试课程、测评、MemorySet；
- `apps/api/tests/MemoPal.IntegrationTests/EducationAssignmentEndpointsTests.cs`：运行时创建 “Biology”“Leaderboard course”等课程和班级/作业；
- `apps/api/tests/MemoPal.UnitTests/EducationAuthoringTests.cs`、`EducationAssignmentTests.cs`、`EducationAssessmentAttemptTests.cs`：用内存实体测试领域和 handler 规则。

**[代码已确认]** 检查范围内没有找到教育 JSON fixture、固定示例课程目录或本地 starter course seed。找到的是测试用例 fixture/factory 和测试方法里的临时构造数据。

## 未实现

**[代码已确认/文档明确]** 以下目标目前没有实现或尚无对应流程：

- 完整 Web 学生答题器；Portal 学生卡片提示在 MemoPal mobile 完成：`apps/admin/src/features/education/pages/EducationHomePage.tsx`。
- Knowledge objective 推荐之后直接在课程内启动 Memory Palace/Number Peg 练习、完成后返回课程并记录连接进度；当前仅 Community 详情链接与复制路径：`EducationPublicCourseScreen.tsx`、`PublicMemorySetDetailScreen.tsx`。
- 从 Community/App 深链之外访问的公开 HTTPS 课程预览、未安装 App 时的 Web/安装回退页面：`docs/education-implementation-status.md`。
- 课程内容复制到个人 Library、知识点推荐私人/未列出的记忆集、跨设备练习偏好同步：`docs/education-implementation-status.md`、`docs/education-assessment-plan.md`。
- 自动语音转写、发音/口语自动评分：现有语音答题是录音 + 人工 rubric；见 `apps/mobile/src/features/education/components/question-inputs/VoiceResponseInput.tsx` 和 `apps/admin/src/features/education/components/ManualResponseGradingCard.tsx`。
- 生产/开发用教育示例课程种子数据：本次检查 `AdminBootstrapper.cs`、`AppDbContext.cs` 和迁移外的构造数据，仅发现测试课程。

## 与文档不符

### 状态文档相对于当前 Git 工作树

1. **更新时间/最新验证时间比教育 UI 提交早。** `docs/education-implementation-status.md` 标记 `Updated: 2026-10-18` 且称“Latest verification on 2026-10-18”；但 Git 在 2026-10-19 的 `81fa6c17` 落入教育 Portal/公开课程/后端功能快照，2026-10-20 的 `82b60bf5` 又改动教育答题器与练习 UI。因而这份文档可作为 10 月 18 日的记录，不能当作 10 月 25 日后最新代码核查/验证。证据：`docs/education-implementation-status.md`、上述 `git log/show`、`apps/mobile/src/features/education/components/EducationAssignmentPlayer.tsx`、`EducationPracticeReview.tsx`。

2. **本次代码核对没有发现明确的产品能力陈述与代码相反。** 状态文档所述公开课/公开练习、关系授权、题型、课程目标记忆推荐、管理员举报管理与两类互相隔离的排行榜，在当前代码中均找到相应 controller/handler/UI/test。以上是按模块抽查/逐项对照的结果，不是逐字形式化验证全文每个句子。

3. **教育规划文档中有旧的 Community 描述。** `docs/education-assessment-plan.md` 的排名章节仍写当前 Community Tab 仅供公开记忆集探索/通用 Community Leaderboard 未实现；当前路由和 UI 已有 `/community/leaderboard`、Community weekly leaderboard，首页也有该入口。该描述与当前实现/状态文档中每周榜功能说明不一致。证据：`docs/education-assessment-plan.md`、`apps/mobile/src/app/community/leaderboard.tsx`、`apps/mobile/src/app/community/leaderboard/community-weekly.tsx`、`apps/mobile/src/features/library/screens/DiscoverMemorySetsScreen.tsx`、`docs/education-implementation-status.md`。此项属于规划文档陈旧，不是教育成绩榜和社区 XP 榜混为一谈；两种榜单数据仍独立。

## 测试执行记录

本次验证结果：

- `npm run check`：通过。Mobile typecheck/lint 通过、115 个移动端测试通过；Admin production build/lint 通过、9 个测试文件和 32 个测试通过。记录到 2 条既有 mobile lint warning（Palace UI hooks deps）；Admin build 有超过 500 kB chunk advisory，jsdom 有 pseudo-element `getComputedStyle` warning。
- `dotnet build MemoPal.slnx`：原样命令因 VS/API 进程持有共享 `bin/Debug/net10.0` DLL 失败；随后使用 `dotnet build MemoPal.slnx -p:BaseOutputPath=C:\Users\jingy\AppData\Local\Temp\MemoPalEducationAudit\bin\` 完整构建通过，0 errors、30 warnings。warnings 是已知 `System.Security.Cryptography.Pkcs` / `System.Security.Cryptography.Xml` NuGet advisories；隔离输出目录避免覆盖正在使用的 API DLL。
- API Unit Tests：隔离输出运行 `dotnet test apps/api/tests/MemoPal.UnitTests/MemoPal.UnitTests.csproj -p:BaseOutputPath=C:\Users\jingy\AppData\Local\Temp\MemoPalEducationAudit\bin\`，272/272 通过。
- API Integration Tests：隔离输出运行 `dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj -p:BaseOutputPath=C:\Users\jingy\AppData\Local\Temp\MemoPalEducationAudit\bin\`，53 通过、1 跳过、0 失败。跳过项 `PostgresAiCreditTests.MigrationsAndIndependentConnectionsEnforceAtomicReservations` 需要设置 `MEMOPAL_CREDIT_TEST_CONNECTION` 指向允许创建隔离测试数据库的 PostgreSQL 服务；本次未配置。来源：`apps/api/tests/MemoPal.IntegrationTests/PostgresAiCreditTests.cs`。
- EF `dotnet ef migrations has-pending-model-changes --no-build --project apps/api/src/MemoPal.Infrastructure --startup-project apps/api/src/MemoPal.Api`：通过，输出 `No changes have been made to the model since the last migration.`。EF tool 10.0.5 比 runtime 10.0.11 旧，并输出版本提示。

初次并行 .NET 命令因共享输出 DLL 文件锁未完成；最终结果来自以上串行/隔离输出执行。`--no-build` EF 检查使用仓库现有 startup build，因为默认输出仍被 VS/API 进程占用；源代码本身已由前述隔离输出 solution build 编译。

## 审计结论边界

**[建议]** 基于源码、Git diff 和自动化测试，可将路径 a 认定为有条件可用、路径 b 认定为在两个账号和手机学生端条件下代码上可用、路径 c 认定为推荐/跳转存在但课程内练习闭环未集成。以上不等于已验证生产服务、真实内容目录、真实账号权限或 iOS/Android 设备 UX。Admin 角色不得被用于绕过课堂、课程所有权或监护关系的数据访问边界。

