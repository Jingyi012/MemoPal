# Education Slice 0 后端实施计划

状态：Slice 0 与授权/课堂关联加固已实施；仅后端、迁移、测试与相关文档，不做管理端/移动端 UI。  
依据：本任务提示优先于桥设计 v2；当前授权沿用 `EducationAccess` 与课程 owner 校验。  

## 1. 涉及范围

- **Domain / persistence**：扩充 `EducationObjective` 元数据；新增 `EducationObjectiveStudyItem` 与稳定导入键、发布状态、内容版本及公开保密确认审计；课程增加公开保密确认审计；增加 `AddEducationObjectiveStudyItems` 与 `AddEducationClassroomCourses` 两份独立迁移。旧行默认 `NotApplicable` / `Unreviewed`，保留 `RecommendedMemorySetId`。
- **校验**：枚举、grade code、字符码点长度、NFC、控制/零宽字符、字段排序、MemoryRef 格式、条目上限、OrderedList 连续性、状态转换、公开确认都由 Application/Domain 服务端执行。
- **API**：在 Education Authoring 路由增加知识点元数据与条目 author CRUD/bulk/reorder/publish/retract/JSON+CSV import；Public Learning 路由增加学习者课程知识点摘要、已发布条目与授权测评摘要。学生 DTO 独立映射，不读取答案键。
- **CSV**：严格 UTF-8 decoder（可去 BOM），独立 CSV 引号/逗号/换行解析；逐物理起始行报告字段错误，全部通过后单次保存。`key` 缺失时从规范化字段哈希派生；同 Objective 内 StableKey 幂等更新。
- **授权**：owner 写及 Draft 通过作者端读；学习者端只返回 Published。读先加载非隐藏/未删除课程和 objective，再允许 owner、当前可发现公开课程学习者，或经现有 assignment 路径/显式 `EducationClassroomCourse` 路径找到且 `EducationAccess.IsActiveClassTeacherAsync` / `IsActiveClassStudentAsync` 为真的成员。显式关联/解除需同时满足课程 owner 和课堂 owner/active teacher。其他情况都以 NotFound 结果拒绝。Admin role 不额外授权。未登录沿用 `[Authorize]` 拒绝。
- **公开内容声明**：课程转公开与公开课程条目发布均要求请求明确 `NotConfidentialExamContent=true`，并存确认用户与 UTC 时间。课程撤下立即关闭公开条目读。

## 2. 代码与测试文件

- Domain：`apps/api/src/MemoPal.Domain/Education/EducationMemoryContentTypes.cs`（或 Entities 同层 enum）、`apps/api/src/MemoPal.Domain/Entities/EducationObjective.cs`、新增 `EducationObjectiveStudyItem.cs`、`EducationCourse.cs`。
- Application：`IAppDbContext.cs`、Education Authoring 的 DTO/validation/commands/queries、Education PublicLearning DTO/queries；新增 study item validator/import parser。
- Infrastructure：`AppDbContext.cs`、`EducationAuthoringConfiguration.cs`、migration 与 model snapshot。
- API：`EducationAuthoringController.cs`、`EducationPublicLearningController.cs`。
- Tests：新增 `EducationObjectiveStudyItemTests.cs` 与 `EducationStudyItemEndpointsTests.cs`；扩展课程公开/作者用例以要求确认字段；所有新增 endpoint 均至少有成功路径和拒绝路径。
- Docs：完成后更新桥 v2、测试缺口矩阵和实现状态，只记录验证通过的能力。

## 3. 迁移与回滚

迁移 `20261025165516_AddEducationObjectiveStudyItems` 添加 Objective 元数据列、课程公开确认审计列、StudyItem 表/索引/外键；迁移 `20261025172714_AddEducationClassroomCourses` 单独添加课堂-课程关联表、唯一索引和三项外键。旧 Objective 采用数据库默认值 `NotApplicable` 和 `Unreviewed`；不改推荐 MemorySet 列及行为。分别回滚到前一迁移会由 `Down` 删除对应新表/列；其中回滚第一份会删除条目内容，第二份会删除课堂关联。部署回滚前需停用新 API，先导出或确认不再需要新增数据。未在生产执行迁移。

## 4. API 和权限测试清单

1. owner 对 objective 元数据、学习条目创建/批量创建/编辑/删除/排序/发布/撤回、JSON 与 CSV 导入成功；不同用户对每种读写以相同 NotFound 结果拒绝。
2. active 当前 classroom teacher/student 可读 Published；学生不能读 Draft；其他班 teacher/student、退班成员、无关用户、Admin 无教学关系全部拒绝。课堂范围沿用既有 assignment→course 关系，不新增角色/绕过。
3. public 登录用户只能读仍公开、未隐藏课程的 Published 条目；Draft 和隐藏/撤下课程 NotFound。匿名请求由认证中间件拒绝。
4. 所有权/课程/知识点不匹配、非法枚举/状态/字段、重复 position/key、OrderedList 断序、超 100 项均失败且不产生部分写入。
5. 公开课程转换与在公开课程发布条目需显式确认；缺失/false 确认拒绝；成功时确认人和时间为服务端写入。
6. CSV 测试 BOM/无 BOM、UTF-8 中文逗号/引号/换行/生僻字/中英混写、非 UTF-8 拒绝、错误行号/字段、原子性、重复导入更新。
7. 单元覆盖 Unicode Rune 计数、NFC、禁止控制/零宽、grade code 正反例、条目语言覆盖、幂等键、发布状态和不越权字段映射。
8. learner DTO 序列化字段白名单断言，确认不含答案键/作者字段；读取前后 PracticeAttempt、XP、EducationAssessmentAttempt 数量不变。

## 5. 风险与已知约束

- `EducationCourse` 仍没有直接 ClassroomId；显式多对多关系存在于 `EducationClassroomCourse`，并与原 assignment→assessment→course 授权路径取并集。active member 退出班级或课程关联解除后，新关联路径立即失效；若该班仍有该课程的 assignment，原授权路径仍有效。
- 当前公开课程目录还有公开练习测评条件。学习条目公开读取需同时遵循当前课程可发现性，不以条目本身绕过目录隐藏/举报规则。
- CSV 只支持严格 UTF-8/UTF-8 BOM。GBK/Big5 必须明确报错并提示另存为 UTF-8。
- `MediaRef` 只接受本模块定义的安全引用格式；本切片不上传媒体，也不返回引用给学习者。
- 公开确认是作者声明记录，不构成版权审核或答案内容扫描。作者仍需避免将保密考题写入学习条目。
- EF InMemory 不验证 PostgreSQL migration/provider 行为；会尝试用隔离本地测试库验证迁移，不配置或访问生产。

## 6. 完成记录

### 实际完成情况（2026-10-26）

- 迁移：`20261025165516_AddEducationObjectiveStudyItems`。Down 删除新建的 `EducationObjectiveStudyItems` 表以及 Objective 新增列、Course 保密确认列；已部署后回滚会删除新表内的学习条目，因此回滚前应先导出/确认这些新内容不需保留。迁移未应用到生产或本地 PostgreSQL。
- 实际模型/API按本计划完成：Objective 元数据和 StudyItem 字段；作者元数据/CRUD/batch/reorder/publish/retract/JSON+CSV routes；学习者 course objective/Published item 路由；ReviewStatus/ContentOrigin 进入 learner DTO；CSV UTF-8+BOM 与逐行错误；Public confidentiality confirm fields。API 路由详见 `EducationAuthoringController.cs`、`EducationPublicLearningController.cs`。
- **偏离/限制：** 本地 PostgreSQL 隔离迁移执行未验证：Docker Desktop engine 不可用；本机 PostgreSQL 服务要求密码，而环境没有配置 `MEMOPAL_CREDIT_TEST_CONNECTION`。EF migration 已生成且 `has-pending-model-changes` 通过；API integration suite 使用 InMemory。课程没有 `ClassroomId`，沿现有 assignment→assessment→course 关系定位当前课堂；不是新增课程关系语义。未做 Admin/mobile UI、媒体上传/读取、课程 revision、MemorySet 派生。
- **测试：** Unit 283/283 通过；Integration 58 通过、1 跳过、0 失败（串行，临时 runner 配置只放在 temp output）。跳过项为 `PostgresAiCreditTests.MigrationsAndIndependentConnectionsEnforceAtomicReservations`，需要 `MEMOPAL_CREDIT_TEST_CONNECTION`。首次并行集成运行有 13 项失败，主要在注册阶段出现 HTTP 500；另一次 runner 配置误放在输出目录，产生 14 项失败。将配置放到实际运行目录后串行全量测试通过。最初单元 GradeCode assertion 失败、首次 Slice0 integration 有 3 项失败，均修正后最终通过，详见实现状态文档。
- **中文/Unicode 测试：** 7 个 Unit case（Rune 码点/组合字符、生僻汉字、零宽字符和语言覆盖等）通过；5 个 Slice0 Integration test methods 覆盖中文条目/中文 CSV、标点/引号/换行/生僻字、中英混合或隐私断言，通过；合计 12 个 case/method。
- `dotnet build MemoPal.slnx`：默认输出目录被 Visual Studio/API 锁定失败；临时隔离 `BaseOutputPath` 构建成功，0 errors、30 现存 NuGet advisories。
- **切片 0 初次验证记录（后由 2026-10-26 Vitest 调查补充）：** 移动端 typecheck/lint 完成且 118 tests 通过；Admin production build/lint 完成；当时在约 30 秒人工观察窗口内未见 Vitest 结果而中断。后续调查证明完整 Admin 测试需要约 53 秒，并非 watch 卡住；更完整证据见 `docs/education-implementation-status.md`。Mobile 有 2 条现存 hook dependency warnings，Admin 有 Vite chunk size advisory。
- `dotnet ef migrations has-pending-model-changes`：通过，无待处理模型变更。`dotnet ef migrations add` 的默认输出初次因锁文件失败，设置临时 `BaseOutputPath` 后成功。最终 solution build、单元测试和集成测试均在最新 source 上重跑通过；`git diff --check` 无空白错误（仅报告 Windows CRLF 转换提示）。

实现事实也已同步到 `docs/education-implementation-status.md`、`docs/education-memory-bridge-design.md` 和 `docs/education-test-gap-plan.md`。未运行迁移到生产，未改变 `PracticeAttempt`/XP 或答案键 DTO，未赋予 Admin 关系之外的学生数据访问。

### 导入预检 API 与管理端作者界面增补（2026-10-26）

- 在现有 JSON/CSV 导入 POST 路由上增加可选 query 参数 `dryRun=true`，选择 query 参数是因为它是同一请求/同一 payload 的执行模式，不需另建资源或改 CSV body 格式；默认 `false` 保持现有提交方式。
- `EducationStudyItemImportPlanner.Create` 是预检与正式导入共用的校验/计划函数。预检只读当前条目并返回 `Imported=false`、新增/更新/不变/拒绝数量、`CanImport` 和逐行原因码；正式提交重新计算当前计划，任一错误整批拒绝。限制：1000 行、1 MiB body、知识点总计 100 条。没有新增迁移。
- 授权复用相同 owner/objective 验证；不改变关系授权语义。Admin/无关用户/其他课程 owner 无关系时仍拒绝，隐藏课程非 owner 仍拒绝。JSON 与 CSV 的预检/提交权限比较、相同错误体、状态/时间戳/版本无写入副作用与 XP/attempt 计数都由集成测试覆盖。
- 管理端采用轻量自有字典/context i18n（未安装新依赖），默认根据浏览器语言选择，手动选择保存在 localStorage。课程知识点编辑面板包含元数据、作者条目 CRUD/顺序/状态、CSV/JSON 预检与确认、双语错误码、公开发布声明、来源/审核状态、学习者 DTO 只读预览；课堂页提供课程关联/解除操作。
- 新增 Admin helper 和组件测试；另加 `ClassroomDetailPage.test.tsx` 检查学生不可见关联按钮、教师可见及解除确认。全量结果和精确测试数以本节最后验证记录为准。
- 无新增 migration；既有 `20261025165516_AddEducationObjectiveStudyItems` 与 `20261025172714_AddEducationClassroomCourses` 属此前 Slice 0 实现，本次不运行迁移。
- **本次结果（2026-10-26）：** API solution build 通过，0 errors、30 warning instances（已有 NuGet advisories 在 restore/build 输出重复）；Unit 283/283；新增 StudyItem integration 聚焦集 9/9；完整 integration 串行与默认并行分别 62 passed / 2 PostgreSQL-gated skipped / 0 failed；EF has-pending-model-changes 无模型变更。一次与 unit 同时启动的并行 integration run 有 14 个注册阶段 500，后续 serial 与独立 parallel full run 均通过。Admin `npm run check` 通过：mobile 118/118、Admin 44/44，Admin 新增 12 个测试；Vite chunk size advisory 与 mobile 两项已有 lint warning 保留。PostgreSQL 未运行，因为 `MEMOPAL_CREDIT_TEST_CONNECTION` 未设置。详情见 `docs/education-implementation-status.md`。

### 授权与课堂关联加固增补（2026-10-26）

- **发现并修复：** learner item route 曾允许 course owner 从此 route 读取 Draft；现所有调用者只收到 Published。缺失课程与无权课程的 404 body 曾不同；现在一致，并由完整 JSON body 比较断言。Course owner 的 author endpoint 在 moderation-hidden 后仍可读，learner routes 立即拒绝。CSV 在 owner 校验后才解析，未经授权不返回行错误。
- **新增课堂关系：** `EducationClassroomCourse` 经显式多对多关联课程与课堂。关联/解除需课程 owner + classroom owner/active teacher；读取班级关联课程需该班 active teacher/student，课程 owner 才可列关联课堂。新关系与 assignment-derived 关系取并集；成员退出后，基于该班关系的访问立即失效，符合独立公开课程规则时公开访问仍沿既有 public path 判断。没有更改 `EducationAccess` 既有函数语义。
- **新增迁移：** `20261025172714_AddEducationClassroomCourses`，回滚到 `20261025165516_AddEducationObjectiveStudyItems` 会删除关联表；回滚整个 Slice 0 到 `20261018173404_AddLeaderboardCreditRewards` 会再删除 StudyItem 表和 Objective/Course 新列。回滚前需确认不再需要关联和学习条目数据。生产未应用。
- **测试隔离：** `CustomWebApplicationFactory` 不再在进程全局写测试数据库/JWT 环境变量；每个 factory 在本地配置独立的 InMemory DB 名称和私有 `InMemoryDatabaseRoot`。修复前五次 parallel suite 有一次失败（14/62，主要是并行 host 注册 HTTP 500）；修复后五次 parallel suite 全通过：每次 60 passed / 2 skipped / 0 failed。串行全套同样 60/2/0。两个跳过均需要 `MEMOPAL_CREDIT_TEST_CONNECTION`。
- **PostgreSQL 测试：** 新增条件测试应用全部迁移→回滚到 Slice 0 前→再次应用，并检查唯一索引、外键、列类型/长度。此次环境变量未设置，所以实际跳过；未声称 PostgreSQL provider 已验证。测试说明见 `docs/dev/postgres-verification.md`。
- **最终检查：** `dotnet build MemoPal.slnx` 临时 `BaseOutputPath` 通过（0 errors，15 warning instances）；API Unit 283/283 通过；API Integration serial 60 passed/2 skipped，parallel 连续 5 次同结果；EF 无待迁移模型变更。`npm run check` 连续三次通过，mobile 各 118 tests，admin 各 32 tests。Admin Vitest 使用 verbose reporter 显示逐项进度；之前 53 秒左右的完整执行曾被更早的人工中断误认为卡住。完整 Vitest 证据见实现状态文档。
