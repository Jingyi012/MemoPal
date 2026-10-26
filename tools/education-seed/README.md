# 小三原创演示课程种子

全部为机器生成的原创演示内容，请教师审核后再用于教学。不是官方教学大纲，不对应任何学校或出版社教材。

## 文件与内容

- `data/my-p3-original.json`：审阅主文件。两门课程、四个知识点、54 条学习条目、6 道生字词语客观小测题。
- `data/characters-and-words.csv`：12 个生字 + 各自两个词语，36 条 LanguageItem。
- `data/idioms.csv`：8 条 LanguageItem。
- `data/water-cycle.csv`：6 条 OrderedList。
- `data/butterfly-cycle.csv`：4 条 OrderedList。
- `../../docs/education-seed-review.md`：每条内容、拼音比较、多音字候选与本条读音、教师审核空栏。

CSV 是 UTF-8 BOM，列名与 Admin `csvTemplate(false)` 和后端 CSV parser 一致。JSON 主文件是层级种子包，不能直接粘贴到 Admin 的单知识点 JSON 导入框；手工导入请用 CSV。

每条源文件内容标为 Original / Unreviewed。当前 API 的来源/审核字段属于知识点，脚本设置父知识点为相同状态；CSV 没有额外的来源/审核列。`MY-P3` 只是年级标签，CurriculumCode 留空，不宣称属于 KSSR 或其他学校大纲。

## 安装与离线审核

需要 Python 3.11+。在仓库根目录的 PowerShell 运行；虚拟环境放在仓库外：

```powershell
$seedVenv = Join-Path $env:LOCALAPPDATA 'MemoPal\education-seed-venv'
py -3 -m venv $seedVenv
$seedPython = Join-Path $seedVenv 'Scripts\python.exe'
& $seedPython -m pip install -r tools/education-seed/requirements.txt
& $seedPython tools/education-seed/seed_import.py --validate
& $seedPython -m unittest discover -s tools/education-seed -p test_seed_tools.py -v
```

`pypinyin==0.55.0` 只提供读音二次校验；没有使用词典释义。没有通过自定义词典覆盖来制造“一致”。`psutil==7.0.0` 用于读取目标监听进程的环境配置；环境/命令行可能包含秘密，因此绝不输出或保存它们。Python 模块、虚拟环境和凭据均不写入种子文件。

离线 `--validate` 会重建四份 CSV 和审核报告，但不会调用 API，也不代替后端 dry-run。权威字段长度、Unicode/类型/顺序校验在现有导入 API 中执行；自动化集成测试已把四份原始 CSV 都送入该 dry-run。

## 本机导入

1. 用已有开发方式启动本机 MemoPal API。它的进程环境必须显式为 `Development` 或 `Demo`；例如项目现有 `http` launch profile 设置为 Development。请确认该实例连接的是你的本地演示数据源。脚本不负责启动或迁移数据库。
2. 通过 App 注册页或本机 Swagger 的普通 `POST /auth/register` 注册专用演示作者。自行选择邮箱和密码；不要创建平台 Admin，不要把凭据写进文件。脚本没有默认账号，也不会自动注册。
3. 在上面的 PowerShell 会话设置运行时环境变量，然后导入：

```powershell
$seedCredential = Get-Credential -Message '输入本机普通演示作者的注册邮箱和密码'
$env:MEMOPAL_DEMO_EMAIL = $seedCredential.UserName
$env:MEMOPAL_DEMO_PASSWORD = $seedCredential.GetNetworkCredential().Password
try {
    & $seedPython tools/education-seed/seed_import.py --url http://localhost:5080
    if ($LASTEXITCODE -ne 0) { throw '演示导入失败；查看脚本的安全错误摘要。' }
} finally {
    Remove-Item Env:MEMOPAL_DEMO_EMAIL, Env:MEMOPAL_DEMO_PASSWORD -ErrorAction SilentlyContinue
    $seedCredential = $null
}
```

也可只设置运行时 `MEMOPAL_DEMO_TOKEN`；不要把实际令牌写进命令历史、脚本或仓库。脚本先调用 `/auth/me` 让服务端验证同一个 JWT，再检查该 JWT 的 subject/普通 User role。令牌不会输出或写入状态清单。

4. 使用同一账号登录 Admin，进入 `/education/courses`，即可看到两门课程和四个知识点。新课程是 **private**，条目和小测都是 **Draft**，仍标 **Unreviewed**。
5. 需要演示已发布学习条目时，重新设置运行时凭据，将导入命令改成：

```powershell
& $seedPython tools/education-seed/seed_import.py --url http://localhost:5080 --publish
```

这会发布本包条目及小测，但课程仍 private，小测 `isPublicPractice=false`，审核状态仍 Unreviewed。脚本没有公开课程参数。若记录的课程后来被手动公开，脚本会拒绝继续处理，因此不会以脚本替代公开课程保密声明。

## 安全边界与幂等

- 仅接受 `localhost`、IPv4 loopback、`::1` 的纯 origin；拒绝公网/局域网主机、用户信息、路径、query、fragment 和非 loopback DNS 结果。
- `psutil` 找到目标端口所属本机 `MemoPal.Api` 进程，核验它显式使用 Development/Demo；Production、Staging、未配置、冲突配置或命令行 environment 覆盖都拒绝。每个 API 请求前重新核验 PID/启动时间。HTTP 重定向和系统 HTTP 代理禁用，无 force/skip-environment 选项。
- Docker、远程主机、反向代理、环境读取权限不足的进程不能通过本机核验，会拒绝。这是本地工具保护，不是给普通 Education API 增加环境限制。它也不能证明一个错误配置为 Development 的 API 所连接数据库一定是演示库，运行前仍须确认本地开发连接。
- 课程、知识点、测评 API 没有 slug 字段。种子 slug → 服务器 ID 的创建回执保存在仓库外 `%LOCALAPPDATA%\MemoPal\education-seed\memopal-demo-my-p3-v1.json`，绑定目标 origin、作者 UserId 和 namespace；不含凭据、答案或原始内容。不同实例/作者须通过 `--state <仓库外路径>` 使用不同清单。
- 条目使用 `(ObjectiveId, stableKey)` 的服务端幂等导入。重复运行会报不变数量；草稿内容增量更新保留 ID；已发布内容更新冲突时报告错误，不擅自撤回。小测题目使用同一个测评的批量 PUT 和保留的题目 ID；已发布测评不可变，内容不一致时停止。
- 无清单时发现同名带种子标记的资源会停止，不自动认领或重复创建。清单记录的资源改名/消失、内容由老师另行修改时会拒绝覆盖。请保留本地清单。
- CLI 使用仓库外独占 `.lock` 文件防止共享同一清单的并行导入。崩溃后只可在确认没有导入进程时手工移除 stale lock。跨机器或不同清单的并发创建没有服务端 seed 唯一键保证。
- 原子性是**单知识点导入 API**提供的；整个课程包不是一个服务器事务。成功创建的父资源会立即写回清单，可在错误修正后重跑。POST 已成功而本地回执写入前崩溃时会因同名冲突停止，需人工恢复回执。

输出只包含创建/更新/不变/发布数量、错误行字段/原因码和审核报告路径；错误时非零退出。服务端作者测评响应有答案字段，脚本从不把响应体打印到日志。

## 清理（已确认的契约缺口）

按产品负责人本次确认：**保持现有 API**。`EducationAuthoringController` 没有课程删除 API，因此：

```powershell
& $seedPython tools/education-seed/seed_import.py --cleanup
```

会返回非零退出码 `CleanupUnavailable`，在认证/网络访问前终止，发送 **零条 DELETE 请求**。不会只删条目后谎称课程已清理，也没有数据库直写后门。纯逻辑测试验证清理范围只能来自本 namespace 创建回执；实际课程清理仍未提供。若使用独立的可丢弃开发实例，可按该实例原有运维方式重置整个隔离数据源；不要在包含真实用户数据的库上执行此操作。

## Admin 手工导入同一 CSV

1. 用普通作者登录 Admin，建立 private 演示课程及四个知识点（可分别放入华文/科学两门课程）。
2. 生字词语、成语选择 `LanguageItem`；水循环、蝴蝶阶段选择 `OrderedList`；语言 `zh-Hans`，年级 `MY-P3`，来源“原创”，审核“未经审核”，课程体系留空。
3. 打开相应知识点“学习内容 → 导入”，选择上述对应 CSV，点“预检”。应分别出现新增 **36 / 8 / 6 / 4** 行，无错误。
4. 点“确认导入”。同一知识点重复上传相同 CSV 应显示“不变”，不会重复创建。默认均为草稿；保留 UTF-8 BOM，不要在表格软件中另存成 GBK/Big5。
5. 检查拼音、Extra 中的拆解提示/例句/适用情境及学习者预览，参照审核报告请教师复核。只有教师实际完成审核后才由其在界面手动标记审核；脚本不代签。

## 测试说明

Python 单元测试覆盖环境拒绝、DNS loopback、生产配置、创建回执/清理范围、状态绑定、并行文件锁、来源与审核策略、稳定键、声调、拼音分歧报告、CSV 与 JSON 一致性。

API 测试文件：`apps/api/tests/MemoPal.IntegrationTests/EducationDemoSeedEndpointsTests.cs`。
第一项把每份 CSV 原样送入既有 dry-run，断言通过并且未写入。第二项通过临时 loopback 转发器访问隔离 TestServer，让同一个 Python importer core 连续运行两次，确认第二次新增/更新为零；另验证草稿更新保留 ID、显式发布及重复发布无变化。测试专用 driver 不对 CLI 暴露环境绕过参数。该 .NET 集成测试需要 PATH 上有 Python 3.11+，或设置 `MEMOPAL_SEED_PYTHON`；其 importer core 不调用拼音库/psutil，因此无需在 .NET 测试运行环境额外安装这两包。

构建和测试按 `docs/dev/education-derivation-testing.md` 顺序执行：先完成构建，再用 `--no-build --no-restore` 运行 API 测试，不能让两个 dotnet 命令同时写 obj/bin。
