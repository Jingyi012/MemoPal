# Starter catalog 教学内容 QA

**范围：** 只读比对 `apps/api/src/MemoPal.Api/Security/EducationStarterCatalog.v1.json` 中的实际嵌入目录与 [`starter-course-content.md`](starter-course-content.md) 的 18 道题、教学项、键与解释。没有改 JSON 或代码。结论用于后续内容修订，不是教师审核或课程认证。

## 结论摘要

- 实际种子目录确有 3 课、每课 2–3 条讲解项和 6 道题，共 18 题，覆盖 single-choice、multiple-select、ordering、matching、true-false、fill-blank。三课答案键整体与规格一致；英语排序、分数排序、配对和填空键可由当前题面完整作答。
- **需优先修的内容缺陷：** 植物排序题把四阶段按正确时间顺序直接写在题干中（“根尖出现、嫩芽出土、真叶、开花结荚”），而 JSON 的选项又提供同样节点。即使选项列表被打乱，题干已经泄露答案。应把题干改为中性指令，把节点只放在打乱后的选项中；不要删掉各选项必要的观察定义。
- **讲解覆盖缺口：** 分数讲解说明了四等份、1/4、3/4 和 2/4=1/2，但没先定义 1/2 为两个等份中的一个；题 `fractions-02` 却测此概念。加一句定义，或先在学习流程里用无评分例题引入，再测量。
- **规格与嵌入目录存在文本差异：** 规格的英语讲解例句更完整；数学、科学讲解也比本次审查时的 JSON 更详。本次审查时 JSON 里科学并未教开花结荚序列，却由 ordering 题和题干提供。状态描述应区分“初始化代码可发布”“隔离库验证”和“实际部署生产”；它们不是同一件事。
- 目前英文题面和选项用英文，其余说明与反馈用中文；这是中英混合教学，不应描述为全英文沉浸课或全中文练习。种子 Objective `LanguageCode` 为 `zh-Hans`，内容检查状态 `Unreviewed`；英文内容仍应由英语编辑核对目标表达、标点和语用。

## 逐课对照

### 英语礼貌请求

JSON 教学项定义 `Can I borrow …?`、`May I borrow …?`、`Can I have …?`，并解释 `please` 与 `Thank you`。六题各自考察借用/索要差别、请求与命令、词序、意义匹配、感谢、`borrow` 词义；题键完整，ordering 的打乱词块组合成唯一句子，matching 的配对唯一。

教学内容没有明说 `Sure` / `Here you are` 的回应方式，而规格短讲解提到了；当前六题也没有测这两个回应，因此不是错误键，但不要宣称实际 seed 已教这项内容。`en-request-01` 的“最礼貌”是给定选项中的比较，反馈要避免推广为跨英语变体只有一个礼貌问法；规格已有“其他礼貌说法”的限定，JSON 反馈目前只解释本题句式，基本克制。题面中文指令、英文例句的语言分工清楚。

### 分数

`fractions-01` 至 `-06` 与规格答案键一致：3/4；1/2 与 2/4；从少到多 1/4、1/2、3/4；三组唯一配对；同样大小整体的各一半；12÷4=3。排序题题干给出分数集合，选项初始顺序 `3/4, 1/4, 1/2`，并没有泄露排序结果。相同整体/等份前提足以消除大小比较歧义，`fractions-05` 也明确两个整体相同大小。

区别于规格，**嵌入 JSON 的讲解没有明确说 `1/2` 是两个等份中的一个**，但 multiple-select `fractions-02` 要辨识“两份中取一份”。建议在教学项里补全；其他算术概念均已有直接讲解。官方事实锚点：英格兰 GOV.UK 数学课程 Year 1 列出把半看作两个等份中的一个、四分之一看作四等份中的一个；Year 2 涵盖 1/3、1/4、2/4、3/4 与 2/4=1/2。引用仅核实概念表述，不表示本课对应英格兰年级或任何官方课程：[DfE National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study)（页面注明更新 2021-09-28）。

### 豆类种子生长

JSON 教学项已经讲萌发/发芽、常见根先出现，水光温度条件，以及根/茎/叶的基本功能。`plants-01`、`-02`、`-04`、`-05`、`-06` 的答案和解释与讲解相符；`-02` 明确是“帮助继续健康生长”的条件，避免把发芽阶段的需光情况与后续长叶混为一谈。主要风险是 `plants-03`：题干自身列出按时间先后顺序的节点，与正确键 `o3 > o4 > o2 > o1` 完全同序。用“按观察时间从早到晚排列以下节点”替换题干，保留原本打乱的选项和观察边界（尤其“第一对真叶展开”而非把子叶误作真叶）。

规格写了成熟豆株开花结荚等内容，实际 JSON 教学项没有；因此 `plants-03` 的开花与豆荚阶段既未教学又在题干泄漏。修复题干时，二选一：先在简短讲解补充成熟豆类可能开花结荚，或把该选项换成已经教过且时间边界可辨的观察阶段。若保留开花结荚，应避免题干/选项本身向学习者预先排列答案。`plants-01` 的“最早可能观察到”与讲解“常能先观察到小根”一致，是谨慎的概括，不需要改成所有种子必然相同。

科学事实锚点：DfE 课程区分“多数种子萌发不需要光”和后续植物生长需要水、光、合适温度；RHS 指引区分早期子叶与之后真叶。[DfE National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study)（更新 2015-05-06）；[RHS Grow With It support pack](https://www.rhs.org.uk/get-involved/grow-with-it/pdfs/grow-with-it-support-pack.pdf)（未核实明确发布日期）。来源支持事实核查，不代表对 MemoPal 课程的背书。

## 事实问题与内容编辑建议

### 需要修订后再称内容/键一致

1. 植物排序题题干排序泄漏；修题干或节点描述并回归核对 `CorrectSequenceIds`。不应只依赖 UI 打乱选项。
2. `fractions-02` 的关键概念未在当前 JSON 讲解中先教：加上 `1/2` 的定义。
3. `plants-03` 的成熟开花结荚节点在当前 JSON 教学项中没有先教；需补讲解或换节点。与上一条合并设计时，仍必须把观察节点打乱呈现。
4. `starter-course-content.md` 原先只描述待导入的规格，应补充初始化实现及隔离库/API 验证状态。但“未发布到生产”仍是事实，本轮没有生产部署，不能由 seeder 代码或测试库的 Published 字段推断线上发布。Seeder 把来源标为 Original，Objective 的审核状态为 `Unreviewed`；不能描述为教师已审核。

### 内容质量建议（不是答案键事实错误）

- 实际 JSON 的英语课程用英文呈现 2 个请求句式，解释/题目指令中文。产品资料应如实称“中文讲解的英语情境表达入门”，不称全英语沉浸。`Can I borrow`、`May I borrow`、`Can I have` 的例句足以做基础辨识和重组，但不能据此声称学习者已经能独立口语交际。
- 正式自主练习中，讲解先于测验是教学设计，不算答案泄漏；但植物 ordering 在题干中直接复述排序是题目层面的意外泄漏，应修掉。分析答题效果时要区分看过课程讲解后的迁移表现和未看讲解的独立回忆，不能仅凭正确率称为掌握。
- 英语 `single-choice` 场景可保持“在这些选项里哪句更合适”这种限定。实际题面“最礼貌”加上命令/残句干扰项差异明显；之后若要测语用细微差别，应加入多个均合理但语境不同的礼貌句式，并明确场景限制。
- 如果后续增添图、音频或手写画布，题目的正确作答路径应仍能通过无障碍文本/替代输入完成。当前三课题目不依赖视觉素材。

## 发布修订与学习记录

仓库现状中，`EducationAssessment` 的已发布题集不可原位更新（`UpdateDraft` 仅允许 Draft）；种子版本采用固定 v1 ID，Seeder 发现已存在的 course ID 会跳过，不覆盖线上课程。`EducationGuidedLearningSession` 持有 `AssessmentId` 和 `AssessmentVersion`；guided home-progress 查询还按会话版本与当前 assessment version 相同筛选。因此，若修订已发布的内容，建议创建新 revision/assessment 并保留旧记录关联原版本，不能把旧题的对错/完成状态直接移到新题上。旧 session 留存与首页是否继续显示旧版本进度是两项不同决策：当前首页筛选可能使旧版本进度不再成为当前课程进度，产品需明确标记“旧版记录/历史”，不要伪装成新版本掌握度。单纯改变公开自练可见性应与内容 revision 分开；该属性不是内容质量审核状态。

核对锚点：[`EducationAssessment.cs`](../../apps/api/src/MemoPal.Domain/Entities/EducationAssessment.cs) 中 Draft-only 更新、发布后不可编辑及版本字段；[`EducationGuidedLearningSession.cs`](../../apps/api/src/MemoPal.Domain/Entities/EducationGuidedLearningSession.cs) 中 assessment ID/version；[`GetEducationGuidedHomeProgressQuery.cs`](../../apps/api/src/MemoPal.Application/Features/Education/GuidedLearning/Queries/GetEducationGuidedHomeProgressQuery.cs) 中仅统计当前 assessment version；[`EducationStarterCatalogSeeder.cs`](../../apps/api/src/MemoPal.Api/Security/EducationStarterCatalogSeeder.cs) 中固定 v1 ID、已存在即跳过及 `ReviewStatus = Unreviewed`；[`EducationStarterCatalogEndpointsTests.cs`](../../apps/api/tests/MemoPal.IntegrationTests/EducationStarterCatalogEndpointsTests.cs) 中新普通用户无课堂/记忆内容也能读取目录、开始并完成公开课的覆盖。

### QA 小结

这 18 题可构成三门入门课的当前骨架，但目录在普通用户端公开可见不等于已被教师审核。合并前至少修正两项概念讲解覆盖和植物排序泄漏，再把内容规格的状态与 JSON 的真实文本同步。现有 learner session 和版本绑定有利于保留历史作答；新版本应独立统计，不继承旧题的 solved/正确状态。
