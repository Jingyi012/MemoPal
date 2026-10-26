# Education 原创演示种子规格 v1

更新：2026-10-26。全部为机器生成的原创演示内容，请教师审核后再用于教学；不是官方教学大纲，不对应任何出版社教材。

## 已实现的文件与范围

事实：`tools/education-seed/data/my-p3-original.json` 包含两门课程、四个知识点、54 个学习条目、六道关联生字词语知识点的客观题。华文课程含生字词语 36 项（12 字各配两个词语）及成语 8 项；科学课程含水循环 6 步、蝴蝶生命周期 4 阶段。课程与测评默认 private/Draft，内容一律 Original、Unreviewed。没有古诗、整段课文、个人资料或媒体。`GradeCode=MY-P3` 只是演示分级，不声称符合 KSSR。

实现：`tools/education-seed/seed_content.py`、`seed_import.py`、`seed_safety.py`；操作说明：`tools/education-seed/README.md`；逐项审核报告：`docs/education-seed-review.md`。

本次没有新增应用 API、模型或迁移。课程目前没有删除接口，用户已批准 `--cleanup` 明确拒绝并说明此限制；没有绕过 API 删除数据库内容。依据：`apps/api/src/MemoPal.Api/Controllers/EducationAuthoringController.cs`、`tools/education-seed/seed_import.py`。

## 文件 schema 与稳定键

主文件包含 `schemaVersion`、`seedNamespace`、`seedVersion`、`courses[]`。课程含 `slug/title/objectives/assessments`；知识点含 `slug/title/memoryContentType/languageCode/gradeCode/curriculumCode/subjectCode/contentOrigin/reviewStatus/sourceNote/memorySuitability/items`。条目含 `key/position/kind/primary/secondary/phonetic/extra/hint/languageCode/contentOrigin/reviewStatus/sourceNote`，生字与词语另带 `entryType/parentCharacter` 审核元数据。

测评含 `slug/title/status/isPublicPractice/questions`，题目含稳定 `key`、`objectiveSlug`、题型、题干、选项、分值及作者答案配置、来源与审核字段。答案配置只用于现有作者 API 创建测评，不用于生成学习条目，不写入状态清单或日志。实际字段与投影：`tools/education-seed/data/my-p3-original.json`、`seed_import.py`。

课程、知识点、测评 slug 与条目 key 在各自父级唯一。现有课程/知识点没有外部稳定键字段，导入器采用带 namespace 的标题标记和仓库外本地状态清单，绑定目标 origin、作者 ID、namespace，记录资源 ID、内容摘要及题目 ID。没有本地收据时遇到同名资源会拒绝认领。教师在 API 外修改既有内容时拒绝覆盖，要求人工核对。并发同一清单由排他锁拒绝；不同机器/不同清单之间不保证全局幂等。依据：`seed_safety.py`、`seed_import.py`。

## 管理端可直接导入的 CSV

`tools/education-seed/data/characters-and-words.csv`、`idioms.csv`、`water-cycle.csv`、`butterfly-cycle.csv` 使用 UTF-8 BOM，列为：

```csv
key,kind,primary,secondary,phonetic,extra,hint,position,language
```

每份文件对应一个知识点，可以直接上传管理端导入对话框。层级主 JSON 不是管理端单知识点 JSON 导入格式。来源与审核状态设置在知识点元数据，不增加 CSV 私有列。依据：`apps/admin/src/features/education/utils/educationStudyItems.ts`、`apps/api/src/MemoPal.Application/Features/Education/StudyItems/`、`seed_content.py`。

权威校验复用现有导入 API 的 dry-run，再正式导入：主文本/释义各 500、拼音 200、Extra 300、Hint 200 Unicode 码点，NFC、禁用字符、有序位置及每知识点 100 项限制均由同一服务端校验执行。Python 不复制后端校验器。离线 `--validate` 仅验证种子政策、稳定键与拼音；不能代替 API dry-run。四份 CSV 的真实 API 无写入预检见 `apps/api/tests/MemoPal.IntegrationTests/EducationDemoSeedEndpointsTests.cs`。

错误输出含行号、字段、原因码与安全消息，失败退出码非零；不输出令牌、密码、服务器原始响应、题目答案。单知识点导入原子，整套课程创建不是跨请求事务；失败后凭清单重试。依据：`seed_import.py`。

## 拼音与内容审核

固定 [pypinyin 0.55.0](https://pypi.org/project/pypinyin/0.55.0/) 二次核对手填声调拼音，使用默认词组读音，无自定义词典覆盖。另逐字枚举库提供的多音候选，报告本条所用读音与词语。候选可能含罕见读音，不声称穷尽所有字典读音。拼音库仅用于读音校验，释义、例句、情境与提示由本演示原创编写。实现及版本：`seed_content.py`、`requirements.txt`。

`docs/education-seed-review.md` 每条一行记录字词、拼音、程序结果、释义、提示、校验状态及教师审核空栏；开头保留“全部为机器生成的原创演示内容，请教师审核后再用于教学”。字形提示只描述可见结构；联想均注明“联想，非字源”，不把画面解释当字源。当前生成统计见报告；程序一致不代表已经教师审核。

## API、账号与发布

通过现有课程/知识点创建、知识点元数据 PUT、学习条目 JSON dry-run/正式导入接口写入；测评使用现有创建、整批题目 PUT、发布接口，题目关联实际 ObjectiveId。没有为种子新增 API。依据：`EducationAuthoringController.cs`、`seed_import.py`。

作者通过普通注册流程创建，无默认账号，无 Admin 引导或角色提升。凭据仅从运行时 `MEMOPAL_DEMO_TOKEN` 或 `MEMOPAL_DEMO_EMAIL` / `MEMOPAL_DEMO_PASSWORD` 读取。服务端 `/auth/me` 验证同一令牌后，导入器检查身份为普通 User；清单不保存凭据。具体命令见 `tools/education-seed/README.md`。

默认创建私有课程、Draft 条目和 Draft 测评；显式 `--publish` 才发布条目与测评，仍不公开课程或测评，不自动教师审核。遇到已公开课程拒绝继续。本脚本没有公开课程参数，因此不隐式代替作者确认公开保密声明。依据：`seed_import.py`。

## 环境限制与清理

只接受本机 loopback origin，并核对 DNS、实际监听进程属于 MemoPal.Api、进程环境显式为 Development/Demo；每次请求重新核对 PID 与创建时间。Production、Staging、未知/冲突环境、非本机地址、重定向、代理，以及不能证明进程环境的 Docker/转发场景均拒绝，没有强制开关。依据：`seed_safety.py`。

局限：进程环境证明不能发现操作者误把 Development 配到生产数据库；运行者仍必须确认本机 API 使用隔离开发数据库。本次不读取或输出数据库连接串。默认清单存于 `%LOCALAPPDATA%/MemoPal/education-seed/`，不得提交；异常遗留锁须核对无运行进程后手动处理。

`--cleanup` 在任何认证/网络请求前明确拒绝，说明现有 API 没有删除课程接口。仅删除脚本创建课程的完整清理能力尚未实现；这是用户确认接受的契约限制，不允许用数据库直删补足。未来若新增删除 API，必须重新验证清单归属与资源实际身份。实现：`seed_import.py`、`seed_safety.py`。

## 验证与尚未覆盖

纯逻辑测试覆盖环境拒绝、稳定键、收据/清理范围、锁、CSV 与主数据一致性、来源/审核政策和拼音核对；文件：`tools/education-seed/test_seed_tools.py`。API 测试使用同一 Python 导入核心，对隔离测试服务器运行，覆盖重复无变化、增量更新、显式发布和再次发布幂等；另验证四份 CSV 通过真实 dry-run 且不写入。文件：`apps/api/tests/MemoPal.IntegrationTests/EducationDemoSeedEndpointsTests.cs`、`Tools/education_seed_driver.py`。

尚未验证：教师对字词、适龄性与科学简化的人工审阅；真实 Excel 保存行为与管理端手动操作；跨机器清单并发；真实部署/生产数据库；删除课程清理。内容政策检查不是版权或个人信息识别的完整证明。未来 Unit、课程版本、服务端种子登记等结构如有需要应另行设计，不视为本次已实现。
