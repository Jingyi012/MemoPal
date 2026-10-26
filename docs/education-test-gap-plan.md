# Education 权限测试缺口计划

状态：计划矩阵；含已实现测试证据和仍需补测的格子。  
日期：2026-10-26

## 1. 判读方式

矩阵逐格表示对应“角色 × 资源”目前是否有足以证明该访问组合的端点测试：

- `Tn`：该资源/角色存在直接或高度相关的自动化测试；路径和覆盖范围在第 2 节列出。
- `Tn~`：有相邻路径覆盖，但没有完整验证矩阵指定的授权前提/拒绝条件；仍有缺口。
- `缺`：在当前 integration test 检索中未找到该组合的明确端点访问测试。不是断言生产代码必然无授权；它表示应补测试。
- 对“当前任课教师”的已有测试仅涵盖创建/拥有自己课程或任务的教师，不证明“任课但非课程 owner”这一独立关系，除非测试名称明确写出。

矩阵资源：课程、知识点、测评、任务、答卷、附件、成绩册、报告、学习条目、派生 MemorySet。学习条目由后端切片 0 实现；派生 MemorySet 后端与下文 T8 权限覆盖已实现，移动端入口仍未接入。

## 2. 现有测试路径索引

- **T1 公开学习**：`apps/api/tests/MemoPal.IntegrationTests/EducationPublicLearningEndpointsTests.cs`。验证公开课程安全学习内容、公开题 practice 不创建 formal attempt、撤下后撤权、公开推荐只返回当前可发现 MemorySet、公开举报/管理流程。它不覆盖 private course/class membership matrix。
- **T2 Assignments/关系使用**：`apps/api/tests/MemoPal.IntegrationTests/EducationAssignmentEndpointsTests.cs`。验证 verified guardian 家庭任务、将 published assessment 指派给 active class students、拒绝 draft assessment/nonmember student、retake 和班级 objective progress、学生班级 leaderboard。多数行为由 creator/有效成员构造；不等于覆盖所有 cross-class reads。
- **T3 Assessment attempts**：`apps/api/tests/MemoPal.IntegrationTests/EducationAssessmentAttemptEndpointsTests.cs`。`StudentStartsSavesSubmitsAndCannotReadOtherStudentsAttemptOrAnswerKey` 覆盖本人作答、不能读取其他学生 attempt/答案键；其他测试覆盖人工批改、结果发布、leaderboard、题型和 response 流程。测试类有私有 response 相关流程；角色×附件的全矩阵仍不足。
- **T4 Relationship lifecycle**：`apps/api/tests/MemoPal.IntegrationTests/EducationRelationshipEndpointsTests.cs`。覆盖邀请接受、不能借 invite 提升平台 Admin、监护确认/verification/revoke、目标用户之外的 decline/revoke、匿名访问拒绝、仅 Admin 查看待核验请求。Admin 的这个专用核验队列权限不等于可读学生课程/成绩。
- **T5 Community memory copy/moderation**：`apps/api/tests/MemoPal.IntegrationTests/CommunityMemorySetEndpointsTests.cs`。覆盖公开集发现、复制、举报、Admin hide、反馈用户隔离；没有教育课程或组织资源派生授权。
- **T6 私人 MemorySet DTO**：`apps/api/tests/MemoPal.IntegrationTests/MemorySetEndpointsTests.cs`。NumberPeg recipe round-trip 测试验证基础结构；教育派生端点与删除清理另由 T8 覆盖，仍不构成完整跨用户访问矩阵。
- **T7 Objective Study Items 与课堂课程关联（2026-10-26）**：`apps/api/tests/MemoPal.IntegrationTests/EducationStudyItemEndpointsTests.cs`。新增测试 `Missing_and_forbidden_learner_course_responses_are_identical_and_csv_errors_are_owner_only`、`Explicit_classroom_course_link_authorizes_active_members_and_preserves_assignment_access_after_unlink`；既有测试也覆盖 owner CRUD/metadata/public confirmation、DTO answer-key redaction、CSV/JSON/batch 幂等、active 班级学生/教师、退班拒绝、moderation hidden、Admin 无关系拒绝、读取不写 PracticeAttempt/XP/EducationAssessmentAttempt。课堂关联测试覆盖两种关联方向多对多、课程 owner 与 active teacher 双重关联授权、active member 读取、unlink/退班即时撤权及既有 assignment 路径保留。切片 0 单元规则在 `apps/api/tests/MemoPal.UnitTests/EducationStudyItemTests.cs`。

单元测试如 `apps/api/tests/MemoPal.UnitTests` 可验证领域逻辑，但不能替代真实 API 中间件、身份和资源查询范围的集成测试。

## 3. 角色 × 资源 × 操作矩阵

列角色：**Own** 资源所有者；**Teach** 当前任课教师；**OtherTeach** 其他班教师；**ActiveStu** active 学生；**OtherStu** 其他班学生；**LeftStu** 退班学生；**Guard** 已验证监护人；**RevGuard** 已撤销监护人；**Stranger** 无关登录用户；**Admin** 平台 Admin 但无教学关系。

矩阵单元的 `Tn~` 表示有相邻测试但仍需覆盖该格列出的权限前提；计划补测时需分别验证允许/拒绝。对目前不存在的资源统一标 `缺`。

| 资源（操作范围） | Own | Teach | OtherTeach | ActiveStu | OtherStu | LeftStu | Guard | RevGuard | Stranger | Admin |
|---|---|---|---|---|---|---|---|---|---|---|
| 课程（读/改/发布） | T1~/T7 | T2~/T7 | T7 | T1~/T7 | T1~/T7 | T7 | 缺 | 缺 | T1~/T7 | T7 |
| 知识点（读/改/推荐） | T1~/T7 | T2~/T7 | T7 | T1~/T7 | T1~/T7 | T7 | 缺 | 缺 | T1~/T7 | T7 |
| 测评（读/改/发布） | T2~/T7 | T2~/T7 | 缺 | T3/T7 | T2~/T7 | 缺 | T2~ | 缺 | T1~/T7 | T7 |
| 任务（创建/读取/撤销） | T2 | T2~ | 缺 | T2~ | T2~ | 缺 | T2 | 缺 | 缺 | 缺 |
| 答卷（读/答/提交/批改） | T3~ | T3~ | 缺 | T3 | T3 | 缺 | T2~ | 缺 | 缺 | 缺 |
| 附件（上传/读取/替换） | T3~ | T3~ | 缺 | T3~ | T3~ | 缺 | T3~ | 缺 | 缺 | 缺 |
| 成绩册（读/批改/发布/更正） | T2~ | T3~ | 缺 | T3~ | 缺 | 缺 | T2~ | 缺 | 缺 | 缺 |
| 报告（读/筛选/撤销访问） | T1~ | T2~ | 缺 | T2~ | 缺 | 缺 | T2~ | 缺 | T1~ | T4~ |
| 学习条目（读/改/审核/媒体） | T7 | T7~ | T7~ | T7 | T7 | T7 | 缺 | 缺 | T7 | T7 |
| 课堂-课程关联（关联/解除/列表） | T7~ | T7~ | T7 | T7 | T7 | T7 | 缺 | 缺 | T7 | T7 |
| 派生 MemorySet（生成/同步/读取/删除） | T8~ | T8 | T8~ | T8 | T8 | T8 | T8 | T8 | T8 | T8 |

### 3.1 矩阵中部分覆盖的含义

- **Own/Teach 差异**：当前很多教育 authoring/assignment handler 用资源 `UserId`/creator ownership；尚无证明当前任课教师可以读非本人拥有的课程资源，也不能把“教师在自己的班级建任务”当作该授权已经实现。须有具体当前任课 relation fixture。
- **T1 公开访问**：公开课程可以被普通登录用户访问是产品定义，不证明该用户可读未公开课程。应同时验证 public allow 与 private/unpublished/hidden deny。
- **OtherStu / Stranger**：公开课程和公开自主练习允许陌生登录者使用；这不代表学生任务/作答/成绩可以跨账号读取。T3 有学生不能读另一学生 attempt 的直接覆盖。
- **Guardian**：verified guardian 的家庭任务存在 T2；这不能推导出 guardian 可以读全班成绩、老师的私有 MemorySet 或所有作业内容。撤销 guardian 对既有报告/附件/缓存的完整 deny 组合仍需覆盖。
- **Admin**：T4 中 Admin 可访问特定 guardian verification queue 属特定功能授权；其他格的 `缺` 表示需要明确证明 Admin 无关系时被拒绝，不能扩大 Admin 访问。
- **StudyItem remaining gaps**：T7 已验证其他班教师不能 link、当前 active 教师能读已关联课程；教师对非 owner 课程写入被拒绝。仍未覆盖已验证/被撤销 guardian、附件媒体授权及期限边界。Admin 写拒绝有元数据/作者列表代表性用例，其他写路由由相同 owner handler 保护但未逐路由 Admin 重复断言。每个新增 StudyItem author endpoint 的 stranger rejection 和目标不存在响应完全相同未逐路由逐响应体重复测试。
- **派生 MemorySet**：当前对应实体/API 不存在；未来切片需覆盖完整所有者、来源授权、同步、撤权和删除矩阵。

## 4. 建议补测顺序和每个测试至少断言

1. **课程/知识点/StudyItem 私有读**：资源 owner、当前任课教师且非 owner、其他班教师、active 学生、其他班学生、退班学生、无关用户和无教学关系 Admin；每组同时测试详情 API、列表、媒体引用、缓存/撤权后的重取。
2. **测评/任务**：在允许的班级内教师可以创建/查看/批改；其他班教师/Admin 无 relation 被拒；只有 assignment recipients/符合规则的家庭对象能启动作答；非成员/退班学生不能用已知 ID 访问。
3. **答卷/附件/成绩册/报告**：本人、当前任课教师、已验证 guardian 的准确权限按政策允许；其他学生、跨班、撤销 guardian、无关用户和 Admin 无关系全部拒绝。`NotFound` 与 `Forbidden` 的选择按既有 endpoint policy 一致，不能泄露资源是否存在。
4. **答案键**：对每种 student-facing course/assessment/attempt/bridge DTO 做序列化断言；不能出现 `AnswerKeyJson`、correct option ID、rubric/teacher notes 或答案影子字段；提交响应只按既有发布/feedback policy 返回解释。
5. **Derived MemorySet**：只当前 owner 可读/编辑/删；其他学生、教师、家长、Admin 无默认内容访问权；current source relation 用于生成/同步；source 更新提示不覆盖个人关联；班级退出后不能再读教师 source，但 own copy 的保存策略须符合用户确认。
6. **闭模式入口**：除 UI 隐藏 tab 外，直调 Community discovery、leaderboard、share/deep link、公开课程、收藏/复制端点也按 closed-scope policy 拒绝/不返回；practice source scope 不参与 public weekly board。
7. **去资格/撤权竞态**：先获取 ID 和 DTO，再退班/撤 guardian/隐藏课程，然后重复 API 读和媒体读取；验证授权实时失效，相关用户缓存失效，正式历史成绩按 retention policy 处理而不被重分配。

## 5. 计划约束

- 本文只规划测试，不增加当前权限实现的通融路径。
- 失败案例不能只测 UI 按钮隐藏；每个关键授权必须由 API integration tests 验证。
- 每个测试数据 fixture 要至少包含两班、两名教师、多名学生、一名 verified 后撤销的 guardian、一个仅平台 Admin 的用户，以便检出跨租户读取。
- 测试必须断言数据库副作用：拒绝操作不创建 attempt/grade/link/XP，读取也不泄露其它用户 ID/姓名/私有内容。
- 当前课堂授权测试和未来 Organization 授权不是同一个测试，不假定新增 Organization 后既有 classroom tests 自动覆盖新 scope。

## 6. Slice 0 import preflight and Admin UI coverage (2026-10-26)

These rows record implemented tests for the opt-in `dryRun=true` mode and the bilingual author interface. They do not change the broader role matrix above.

| Role / resource-operation | Existing coverage | Remaining gap |
|---|---|---|
| Course owner × StudyItem JSON/CSV import preflight and commit | API integration: `EducationStudyItemEndpointsTests.Import_dry_run_is_side_effect_free_matches_commit_plan_and_rechecks_changed_data`, `Import_dry_run_and_commit_share_owner_authorization_and_hidden_course_checks`, `Csv_import_is_utf8_atomic_and_idempotent_with_multilingual_quoted_content`; API preflight uses shared `EducationStudyItemImportPlanner` | Concurrent writes between preview and commit are modeled by a changed-entity recheck, but not a database concurrency race test |
| Unrelated user / other course owner × StudyItem import | API integration: `Import_dry_run_and_commit_share_owner_authorization_and_hidden_course_checks` compares preview and commit denials; `Missing_and_forbidden_learner_course_responses_are_identical_and_csv_errors_are_owner_only` checks hidden/existence response parity | Add separate denial tests for every authorization principal only if handler authorization changes |
| Platform Admin without relationship × StudyItem import | Same integration test explicitly uses an Admin with no course relationship for preview and commit | None for the current owner-only import policy |
| Anonymous user × StudyItem import | Same integration test compares authentication behavior for preflight and commit | None for current authentication contract |
| Hidden course, non-owner × StudyItem import | Same integration test verifies preview and commit denial | Course owner’s authoring access after moderation hide remains a separate policy test |
| StudyItem import × write side effects / answer-key separation | `Import_dry_run_is_side_effect_free_matches_commit_plan_and_rechecks_changed_data` snapshots stored study row identity/content/version/timestamps and checks practice/XP/education attempt counts; serialized result has no answer or author-private properties | Database-provider-specific concurrency/transaction behavior needs PostgreSQL verification when the gated connection is available |
| StudyItem CSV × encoding, BOM, multilingual punctuation, rare Unicode | `Csv_import_is_utf8_atomic_and_idempotent_with_multilingual_quoted_content`; includes BOM, Chinese punctuation, quotation marks, newlines, rare CJK character, bilingual content, and rejection of non-UTF-8 | Add explicit duplicate header and very long single-line encoding boundary cases if parser contract expands |
| Admin author UI × import error presentation and submit state | `EducationObjectiveStudyEditor.test.tsx`: rejected preflight rows, no raw server message, confirmation disabled; mismatch notice; publication declaration; learner projection; IME; load/empty/error | Add browser-level test for actual file picker/Excel save-as workflow; unit tests cover parser/helper, not a real browser filesystem |
| Admin author UI × bilingual reason codes / input helpers | `educationStudyItems.test.ts`: every API reason code maps to a translation key and EN/zh-Hans key sets match; code-point limits, CSV parser, sort/template helpers | Screen-reader/browser accessibility audit remains manual |
| Active classroom teacher vs student × course link controls | `ClassroomDetailPage.test.tsx`: educator sees link/unlink controls and unlink confirmation; student sees neither and gets Published-only notice | Server remains source of truth; UI tests do not replace relation authorization integration coverage |

`dryRun=true` rows are marked covered for the current API/UX contract. No test here grants platform Admin or withdrawn members relationship-free access.

## 7. 派生 MemorySet 后端覆盖（2026-10-26）

- **T8**：`apps/api/tests/MemoPal.IntegrationTests/EducationStudyItemEndpointsTests.cs` 中的 `Active_linked_student_can_derive_private_memory_and_repeat_without_duplicate_or_education_side_effects`、`Derivation_status_rejects_unsupported_types_and_hidden_sources_with_not_found_parity`、`Sync_adds_updates_only_untouched_items_and_keeps_removed_and_user_edited_items`；单元规则：`apps/api/tests/MemoPal.UnitTests/EducationMemoryDerivationTests.cs`。

| 角色 × 派生资源 / 操作 | 现有测试 | 缺口 |
|---|---|---|
| 学习者本人：查询状态/派生/同步/读取私有集 | T8：课堂关联 active 学生、公开课学习者；顺序重复与 8 路并发幂等；源撤权后本人仍读自有集 | assignment-only 派生路径和 MemorySet 里真实提交练习仍未专门端到端覆盖 |
| 课程所有者：本人内容派生 | T8：owner 隐藏课读取被拒；Owner MemorySet GET 另测不能读学生的派生集 | owner 正常成功派生的独立 happy-path 命名用例仍可补；现有主体成功例为 active linked learner |
| 当前任课教师 | T8：课堂 teacher 不能读取学生派生集；桥接来源查询仍按现有学习条目授权 | teacher 对他人自有集的所有 edit/delete 操作并未逐一覆盖 |
| 同班其他学生 | T8：直接 GET 同班另一个学生派生集 404 | 社区/API 除目录与搜索外的每个查询筛选器没有重复覆盖 |
| 其他班教师/学生、退班学生、无关登录用户 | T8：既有 stranger/foreign bridge deny；退班后 source status/sync 404，但本人 MemorySet GET 仍 200 | 其他班 active member 的直接 MemorySet GET 当前统一 owner-scope；逐角色 HTTP body parity 未全部展开 |
| 已验证监护人、被撤销监护人 | T8：集成测试创建 active verified link 与 revoked link，两类直接 GET 学生派生集均 404 | 其它监护 API/报告授权与派生集是不同资源面，仍不由本测试推导 |
| 平台 Admin（无课堂/课程关系） | T8：桥接状态/derive/sync 及其他人 MemorySet GET 都拒绝 | Admin 其他 MemorySet mutation 的每个 endpoint 未在本切片重复调用 |
| DTO 答案键/作者私有/个人联想隔离 | T8：bridge status/derive JSON 断言没有 `answerKey`、`stableKey`、媒体/作者私有字段；派生 GET 只走 `ForUser` | 没有覆盖所有 API error envelope 的 schema snapshot；学习者 DTO不引用 EducationQuestion 由静态代码检查确认 |
| Community、PracticeAttempt、XP、成绩证据 | T8：private 集不在 Community 目录和 search；派生与同步前后对比 PracticeAttempt、XP events、教育 attempt/response、grade revision、leaderboard、public progress、XP 总量和 streak | 用户后续手动把私有集设为 public 的既有 visibility 流程未由桥接禁止或专门过滤 |
| 删除并重新派生 | T8：MemorySet API 软删除后派生 provenance 与 maps 同事务软删除；相同来源可重新派生 | PostgreSQL provider 的事务回滚/唯一冲突覆盖取决于环境变量条件用例 |
| Palace / Peg 个人联想与绑定 | T8：源同步测试断言用户自己的 PalaceBinding 及 AssociationText 保留；并发 Peg sync 断言 PegBinding/SceneText 保留 | PostgreSQL 冲突恢复之外的客户端与绑定版本冲突仍未覆盖 |
| 超容量拒绝 | T8：Palace、Number Peg 各 101 项派生均拒绝且无派生行/MemorySet；101 项目标同步拒绝且旧条目/maps 不变 | PG 真实 provider 的容量拒绝需条件数据库测试才覆盖 FK/事务 provider 差异 |
| 跨请求并发幂等 | T8：8 个并发 derive 返回同一 MemorySetId，仅 1 个请求标为新建；8 个 sync 只新增 1 个 item/map | InMemory 不执行 DB unique index；新增 gated PostgreSQL independent-context concurrency test，未配连接时跳过 |

这些用例不授权 Admin、教师、监护人读取个人 MemorySet，也不写教育成绩或 attempt；仍需补足上表列出的角色专项和 PostgreSQL provider 测试。

## 8. Restricted Learner 服务端执行与两项补测（2026-10-26）

本节为已写测试对照，最终运行结果见 implementation-status。文件根：`apps/api/tests/`。

| 角色 × 资源 / 操作 | 覆盖测试 | 结论与边界 |
|---|---|---|
| Restricted vs Standard × Community 目录/搜索/详情/复制/点赞/收藏、周榜 catalog/current/preference、公开课程目录/详情/收藏/历史 | IntegrationTests/RestrictedLearnerEndpointsTests.cs：`Denied_categories_return_the_same_safe_403_and_standard_behavior_is_preserved`，15 组 | 同一调用者切换前后对照；受限为统一安全 403，Standard 保留原 200/404 |
| Restricted × 公开上传、Palace/Peg 外部生成、图片生成、转介绍 | 同文件：`Public_upload_external_generation_and_social_writes_are_blocked_before_body_processing`，6 组 | 符合路由 Content-Type 的请求在 Controller 执行前 403；畸形媒体类型可由路由选择先返回 415，无执行或写入 |
| Restricted × 自有 MemorySet 创建/读取/编辑/复制、练习、Palace/挂钩定义；他人资源拒绝 | 同文件：`Restricted_learner_can_use_own_memory_practice_and_presets_but_cannot_publish_or_read_another_owner` | Private 正常；Public/Unlisted 在 create/update/visibility 均拒绝；他人集 404；保留正常个人练习 XP，不引入教育成绩关联 |
| Restricted × 学习条目/memory-bridge 来源授权、课堂关联与 assignment 两路径、退班 | 同文件：`Restricted_bridge_requires_active_classroom_even_for_public_course_and_withdrawal_revokes_source_access`，2 组 | 仅公开路径拒绝；不存在/无课堂授权的来源状态码和响应体相同；active 课堂路径允许；课堂摘要不泄露未分配的公开测评；退班后源拒绝、本人副本保留；读取/派生/同步前后 practice/XP/Education attempt 计数不变 |
| Restricted × 本人课堂作业/作答/已发布结果/课堂榜 | 上述 assignmentPath=true 分支 | 真实 API 启动、保存、提交，达到截止时间后教师发布，本人可读；额外验证受限的旧教师不得用附件入口读他人答卷，作者任务详情入口拒绝；正式教育作答不产生 PracticeAttempt/XP；教师/学生默认不启用完整榜 |
| Admin / 非 Admin × 设置与取消标记、审计、同令牌即时失效 | 同文件：`Admin_mode_toggle_is_immediate_for_the_same_token_and_non_admin_is_denied` | 两次切换均有对象/操作者/时间/原因审计；非 Admin 无新增审计；无模式缓存，不需重新登录；非法枚举和空原因拒绝 |
| 客户端伪造模式 × 注册/登录 DTO | 同文件：`Authentication_ignores_client_account_mode_and_returns_the_persisted_mode` | 入参模式被忽略，返回数据库值；注册保持默认 Standard |
| 未分类新动作 × 默认拒绝；Admin 响应/日志 × 私有原因 | 同文件：`Unclassified_action_fails_closed_and_admin_mode_response_and_logs_do_not_expose_private_payload`，测试控制器在 Fixtures/RestrictedPolicyProbeController.cs | Standard 到达动作，Restricted 403；新增标记接口只回布尔值，无记忆/作业/成绩/个人资料或私有原因；捕获日志无私有原因 |
| 全部生产 Controller 动作 × 明确分类 | UnitTests/RestrictedLearnerPolicyTests.cs：`Every_controller_action_has_an_explicit_restricted_learner_classification` | 反射全部具体控制器公开动作，含无 Http 标注的潜在新动作，要求单个有效动作级分类；不接受控制器级继承默认 Allow |
| 账号默认 / 策略允许与默认拒绝 | 同文件：`Existing_and_new_accounts_default_to_standard`、`Restricted_policy_is_explicit_allow_and_standard_policy_is_unchanged`（6 组） | 默认 Standard；Restricted 缺失/Deny 拒绝，Allow/Conditional 仍需资源条件；Standard 不受新动作分类阻挡 |
| Restricted 旧公开集 × 他人目录/已知 ID/复制；Admin 显式转 Private | IntegrationTests/RestrictedLearnerEndpointsTests.cs：`Existing_public_memory_is_hidden_without_mutation_and_admin_privatization_is_explicit_and_audited` | 设置标记不改旧 visibility；他人目录/详情/复制不可见；显式操作仅 Private 且记审计、响应无内容 |
| Restricted 旧参与者 × 周榜名次/人数/行/奖励预估 | 同文件：`Existing_weekly_participation_is_excluded_and_standard_snapshot_stays_identical` | 真实五项 recall 达到计分门槛，本来会改变 Standard 名次；受限后标准行、人数、名次、分数和奖励预估与其加入前一致；旧参与行未删除 |
| Restricted 旧复制/点赞 × Community 热门/摘要/详情聚合 | 同文件：`Restricted_activity_is_excluded_from_community_popularity_and_detail_counts` | 模式切换后不计复制/有用数，旧记录不删除 |
| Restricted / Standard 已退出者 × 周榜结算 | UnitTests/LeaderboardRewardTests.cs：`Restricted_players_are_excluded_from_settlement_without_erasing_standard_optout_activity` | 受限者不计名次/奖励；Standard 已退出者的既有个人活动分数保留，原退出排名语义不变 |
| Restricted 旧队列 × 外部图片 provider | IntegrationTests/RestrictedLearnerBackgroundTests.cs：`Previously_queued_image_does_not_send_content_after_account_becomes_restricted` | 从真实 API 排队后设置 fixture 模式，worker 不调用假 provider；未发真实外网请求 |
| Restricted × 既有私有生成图片读取 | IntegrationTests/RestrictedLearnerBackgroundTests.cs：`Existing_private_images_remain_owner_readable_without_new_external_calls` | 本人 image/data 两路允许、他人拒绝，provider 调用数不增加；不等于允许新生成 |
| 每种 MemoryContentType × Palace/Number Peg 推荐/允许/拒绝 | UnitTests/EducationMemoryTechniqueMatrixTests.cs：`Status_contract_fixes_every_content_type_and_technique_pair`，22 组 | 通过公开 Status handler 检查字面预期，未测试私有 Fit 方法，也未改变当前矩阵 |
| 新账号标记/审计 schema × PostgreSQL 迁移往返；上轮独立上下文并发 | IntegrationTests/PostgresEducationSlice0Tests.cs 两个 gated 用例 | 已扩展新表 PK 唯一索引、User FK、列类型/长度及回滚移除断言；无连接时明确跳过，不能推导真实 provider 已验证 |

新增测试用例数：单元 31（矩阵 22 + 策略/默认/分类 8 + 结算回归 1）、集成 32（Endpoints 30 + 后台/私有图片 2）。未删除、跳过或放宽原有测试；三个 PostgreSQL gate 沿用现有缺连接时的跳过条件。历史静态公开媒体撤销、真实客户端适配、账号标记与已开始请求的竞态、生产部署/缓存行为尚未完整端到端验证。现有教育课堂榜同意和监护/跨课堂资源授权仍按原测试矩阵，不由 Admin 标记接口获得任何内容读取权。
