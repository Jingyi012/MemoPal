# MemoPal 2.0 试点小课原创内容样稿

**状态：原创试点样稿，待小学教师/学科教师审核。**  
**目标年龄：约 7–9 岁，仅为设计难度示例；不声称对齐任何国家官方课程。**  
**用途：** 展示英文情境表达、数学分数和科学植物生长三类课程可以怎样组合短讲解与现有 Education 客观题型。仅用于产品/内容评审，不是发布课程或生产导入文件。

所有题干、情境和选项均为本文件原创。引用的教育机构/课程资料只用于核对事实与教学边界，没有复用其练习题、图片、音频或其他媒体。上线前仍需审阅内容准确性、年龄适切性、语言水平、地区差异和无障碍呈现。

## 与当前 Education 合同的对应方式

现有合同支持本样稿使用的六种客观题：`single-choice`、`multiple-select`、`ordering`、`matching`、`true-false`、`fill-blank`（文本或数字）。题目共享 ID、题干、类型等字段；选项使用唯一 ID。排序题要列全每个选项一次，且作者给出的初始顺序必须不同于答案顺序；配对题要求左右两侧数量一致，每个左项只有一个正确配对。单/多选各要求 2–4 个选项；配对/排序各要求 2–10 项。下列 ID、选项和答案片段是**用于评审的合同字段示例，不是可直接导入的完整 JSON**：实际 `EducationQuestionRequest` 还要求 `Prompt`、`Type`、`FillMode`（非填空可空）、`MaxScore`、`ObjectiveId` 等字段。文中的 `CorrectOptionId`、`CorrectOptionIds`、`CorrectSequenceIds`、`CorrectBooleanAnswer`、`AllowedTextAnswers`、`AllowedNumericAnswers`、`NumericTolerance`、`TrimTextAnswers`、`IgnoreCase`、`MatchingPairs` 和 `Explanation` 均为当前作者 DTO 的真实字段名。作者 DTO 中配对答案通过 `MatchingPairs` 的 `Left`/`Right` 选项对提交；`MatchTargets` 是学生题目 DTO 派生出的右侧选项列表，不是作者请求字段。作者和学生端的 C# / TypeScript 属性大小写不同，不能将此文直接当导入 payload。

表中“学生看到”字段可用于构造安全题目投影；“作者答案键”与“答案解释”属于教师/作者材料。按现有 Education 规则，正确答案键不应混入学生题目 DTO；正式作业的解释遵循现有结果发布流程。公开练习应使用 PublicLearning 现有合同和服务端检查结果。这里不执行课程创建、发布或导入。

---

## 小课一：在教室里礼貌地提出请求

**学科/领域：** 英语情境表达  
**建议时长：** 约 5–8 分钟，实际时间待儿童试用  
**学习目标：** 学生能在借用或请求物品的日常情境中，辨认并排列礼貌请求句；能将请求句匹配到意图；能在情境中选用 `please`，并知道接受帮助后可说 `Thank you.`

### 短讲解（原创）

想借同学的尺子时，可以说：**“Can I borrow your ruler, please?”** 这里 `Can I borrow …?` 用来询问能不能暂时借用；在请求结尾加 `please`，语气会更礼貌。对方可以说 **“Sure!”** 或 **“Here you are.”**；拿到帮助后，可以说 **“Thank you.”**

也可以请求别人给一件东西，例如：**“Can I have some water, please?”** 真实对话还会有其他礼貌说法。本课练习的是两种常见表达，不代表只有这一种正确句式。

事实/适龄表达核对：British Council LearnEnglish Kids 将 `please`、`thank you`、`Can I have …?` 列作可在儿童日常英语中使用的短语，并建议在情境中练习语言；此为建议性教学资料，不是课程标准。[British Council LearnEnglish Kids：How to start teaching kids English at home](https://learnenglishkids.britishcouncil.org/zh-hans/parents/helping-your-child/how-start-teaching-kids-english-home)（页面未核实发布日期；访问 2026-10-27）。英国教育部英语课程文件强调小学口语学习包括适切回应、提问、清晰表达和角色扮演；本样稿仅参考该公开资料，不声称课程对齐英格兰或其他国家课程。[GOV.UK：National curriculum in England: English programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study)（页面标注更新于 2014-07-16；访问 2026-10-27）。

### 题目与答案

#### E1 · 单选（`single-choice`）

- **目标：** 从同伴请求中辨认礼貌表达。
- **学生题面：** Maya 想暂时借用同学的铅笔。哪句话表达得最礼貌？
- **Options：** `a` “Give me your pencil.”；`b` “Can I borrow your pencil, please?”；`c` “Pencil. Now.”
- **作者答案键：** `CorrectOptionId: "b"`
- **答案解释：** “Can I borrow …?” 清楚说明她想暂时借用；句末的 “please” 让请求更礼貌。其他句子听起来像命令或不完整表达。

#### E2 · 多选（`multiple-select`）

- **目标：** 在不同物品情境中找出礼貌请求句。
- **学生题面：** 选出所有礼貌请求句。
- **Options：** `a` “May I borrow your ruler, please?”；`b` “Can I have some water, please?”；`c` “Give me water!”
- **作者答案键：** `CorrectOptionIds: ["a", "b"]`
- **答案解释：** a、b 都以问题形式提出请求并包含 “please”；c 是命令语气。

#### E3 · 排序（`ordering`）

- **目标：** 复原常见礼貌借用句的词序。
- **学生题面：** 把所有词块排成一句礼貌的借尺子请求。
- **Options（作者展示的初始顺序）：** `please?`（`o1`）、`your`（`o2`）、`Can`（`o3`）、`ruler,`（`o4`）、`borrow`（`o5`）、`I`（`o6`）
- **作者答案键：** `CorrectSequenceIds: ["o3", "o6", "o5", "o2", "o4", "o1"]`
- **答案解释：** 按顺序读是 “Can I borrow your ruler, please?”。每个词块各用一次；这组词只有一个目标句序。

#### E4 · 配对（`matching`）

- **目标：** 将请求句匹配到说话者的意图。
- **学生题面 / 左列：** `l1` “Can I borrow your ruler, please?”；`l2` “Can I have some water, please?”
- **学生题面 / 右列（派生的 `MatchTargets`）：** `r1` “我想暂时使用你的尺子。”；`r2` “我想请你给我一些水。”
- **作者请求字段 `MatchingPairs`：** `[{Left:{Id:"l1",Label:"Can I borrow your ruler, please?"},Right:{Id:"r1",Label:"我想暂时使用你的尺子。"}},{Left:{Id:"l2",Label:"Can I have some water, please?"},Right:{Id:"r2",Label:"我想请你给我一些水。"}}]`
- **答案解释：** `borrow` 表示暂时借来使用；`have some water` 在这里是请求对方给一些水。配对检查的是句子的意图，而不是逐词翻译。

#### E5 · 判断（`true-false`）

- **目标：** 识别收到帮助后的礼貌回应。
- **学生题面：** 朋友把尺子借给你后，说 “Thank you.” 是合适的回应。
- **作者答案键：** `CorrectBooleanAnswer: true`
- **答案解释：** “Thank you.” 可以用来感谢别人给出的帮助。情境中也可以再说 “Here you are.” 作为递出物品的人。

#### E6 · 文本填空（`fill-blank`, `fillMode: "text"`）

- **目标：** 在请求中回忆礼貌用语。
- **学生题面：** Complete the request: “Can I borrow your ruler, ___?”
- **作者答案键：** `AllowedTextAnswers: ["please"]`；建议 `TrimTextAnswers: true`、`IgnoreCase: true`
- **答案解释：** 这里用 “please” 礼貌地结束请求。答案不需要标点；题目已提供逗号与问号。

---

## 小课二：认识二分之一、四分之一和四分之三

**学科：** 数学  
**建议时长：** 约 6–9 分钟，实际时间待儿童试用  
**学习目标：** 学生能说明分数描述的是一个整体被平均分后的部分；识别 `1/2`、`1/4`、`3/4`；理解 `2/4` 和 `1/2` 可表示同样大小；能求一个容易平均分数量的简单几分之一。

### 短讲解（原创）

先看“整个东西”被分成了几份，再看我们拿了几份。分出来的每一份必须一样大，才是平均分。比如一张披萨分成 4 片一样大的，拿走 3 片就是 `3/4`。如果拿 2 片，就是 `2/4`；这和把同样大小的披萨平均分成 2 份后拿 1 份（`1/2`）一样多。

求一个数的几分之一，可以先把它平均分成相应份数，再数需要的份数。例如 12 颗葡萄平均分成 4 组，每组 3 颗，所以 `1/4 of 12 = 3`。

事实核对：英国教育部数学课程把一半定义为两等份中的一份，把四分之一定义为四等份中的一份；其后续年级材料涉及 `1/3`、`1/4`、`2/4`、`3/4` 及 `2/4 = 1/2` 的等值关系，并以图形、集合和数量表征分数。[GOV.UK：National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study)（页面标注更新于 2021-09-28；访问 2026-10-27）。本课只借此核对数学事实与常见表示，不声称对齐英国或任何地区年级课程。

### 题目与答案

#### M1 · 单选（`single-choice`）

- **目标：** 根据等分部分识别分数。
- **学生题面：** 一个圆被平均分成 4 块，其中 3 块涂色。涂色部分可以写成哪个分数？
- **Options：** `a` `3/4`；`b` `4/3`；`c` `1/4`
- **作者答案键：** `CorrectOptionId: "a"`
- **答案解释：** 整个圆分成 4 份，涂色的是其中 3 份，因此是 `3/4`。分母 `4` 数总等份，分子 `3` 数选中的等份。

#### M2 · 多选（`multiple-select`）

- **目标：** 识别相同的二分之一表示。
- **学生题面：** 选出所有表示“整体的一半”的说法。
- **Options：** `a` “2 个一样大的部分中取 1 个” (`1/2`)；`b` “4 个一样大的部分中取 2 个” (`2/4`)；`c` “4 个一样大的部分中取 1 个” (`1/4`)
- **作者答案键：** `CorrectOptionIds: ["a", "b"]`
- **答案解释：** a 是两等份中的一份；b 是四等份中的两份。这两种分法取得的整体比例相同。c 只取四等份中的一份，是四分之一。

#### M3 · 排序（`ordering`）

- **目标：** 按从小到大比较同一整体的单位分数与简单非单位分数。
- **学生题面：** 从三个同样大小的完整蛋糕中，分别取 `1/4`、`1/2`、`3/4`。把所取份量从少到多排列。
- **Options（初始顺序）：** `3/4` (`o1`)、`1/4` (`o2`)、`1/2` (`o3`)
- **作者答案键：** `CorrectSequenceIds: ["o2", "o3", "o1"]`
- **答案解释：** 这三者取自同样大小的整体。`1/4` 小于一半；`3/4` 比一半多，所以顺序为 `1/4 < 1/2 < 3/4`。

#### M4 · 配对（`matching`）

- **目标：** 将符号与等份描述对应。
- **学生题面 / 左列：** `l1` `1/2`；`l2` `1/4`；`l3` `3/4`
- **学生题面 / 右列（派生的 `MatchTargets`）：** `r1` “4 个一样大的部分中取 3 个”；`r2` “2 个一样大的部分中取 1 个”；`r3` “4 个一样大的部分中取 1 个”
- **作者请求字段 `MatchingPairs`：** `[{Left:{Id:"l1",Label:"1/2"},Right:{Id:"r2",Label:"2 个一样大的部分中取 1 个"}},{Left:{Id:"l2",Label:"1/4"},Right:{Id:"r3",Label:"4 个一样大的部分中取 1 个"}},{Left:{Id:"l3",Label:"3/4"},Right:{Id:"r1",Label:"4 个一样大的部分中取 3 个"}}]`
- **答案解释：** 分数符号上方的数表示取几份，下方的数表示整体平均分成几份。每条描述只对应一种符号。

#### M5 · 判断（`true-false`）

- **目标：** 判断等值分数陈述。
- **学生题面：** 如果整体平均分成 4 份，取其中 2 份，得到的大小和取一半相同。
- **作者答案键：** `CorrectBooleanAnswer: true`
- **答案解释：** `2/4` 可看成两个四分之一，合起来占整体一半，所以 `2/4 = 1/2`。两种图形必须表示同一个完整整体。

#### M6 · 数字填空（`fill-blank`, `fillMode: "number"`）

- **目标：** 求一个数量的四分之一。
- **学生题面：** 12 颗葡萄平均分成 4 组，每组有 ___ 颗。
- **作者答案键：** `AllowedNumericAnswers: [3]`；`NumericTolerance: 0`
- **答案解释：** `12 ÷ 4 = 3`。这里的“每组”就是四组中的一组，即 12 的四分之一。
- **歧义检查：** 提示明确“平均分成 4 组，每组”，问的是每组数量，不是剩余数量或两组数量；数值题只接受 `3`，不会把字符串 `3/4` 当作答案。

---

## 小课三：豆子从种子开始长大

**学科：** 科学  
**建议时长：** 约 6–9 分钟，实际时间待儿童试用  
**学习目标：** 学生能按一个豆类植物的示例排列种子萌发、幼苗、生长成熟与结籽等可观察阶段；认识植物长大通常需要水、光、空气、养分和生长空间；区分种子开始萌发与长出叶片后继续生长。

### 短讲解（原创）

先从一粒豆子开始。种子在合适条件下开始萌发，会长出小根和小芽；接下来它成为幼苗，长出叶子。随着植株长大，它会长出更多叶和茎；许多开花植物成熟后会开花、形成种子。

幼苗继续生长需要合适的水、光、空气、养分和空间。长出叶子后，植物会利用光和空气中的二氧化碳，加上水制造糖分，作为生长所需的食物。**注意：** 不要把“种子必须先晒到光才会萌发”教成普遍规律；不同植物的种子条件不完全一样，许多种子萌发初期可利用种子自身储存的养分。这个小课讲的是“豆类植物的一个常见观察过程”，不是所有植物都完全相同。

事实核对：英格兰科学课程要求学生观察种子/球茎长成成熟植物，了解植物生长需要的空气、光、水、土壤养分和空间，并注明不同植物的需求会有差异；课程也提到大多数种子萌发时不需要光，因为种子有储存养分。[GOV.UK：National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study)（页面标注更新于 2015-05-06；访问 2026-10-27）。Royal Horticultural Society 的种植指南将萌发描述为种子形成根和芽、随后成为幼苗，之后可见真叶、开花和结籽等阶段；其资料也建议幼苗明亮放置、适量浇水。[RHS：Grow With It support pack](https://www.rhs.org.uk/get-involved/grow-with-it/pdfs/grow-with-it-support-pack.pdf)（页面未核实发布日期；访问 2026-10-27）。RHS 另说明植物利用光、水和空气中的二氧化碳进行光合作用并制造糖。[RHS：How plants use light to grow](https://www.rhs.org.uk/advice/understanding-plants/how-plants-use-light-to-grow)（页面未核实发布日期；访问 2026-10-27）。这些资料用于事实核查；本课既非英格兰课程材料，也不声称课程对齐。

### 题目与答案

#### S1 · 单选（`single-choice`）

- **目标：** 识别萌发的可观察迹象。
- **学生题面：** 一粒豆子刚开始萌发时，最先可能观察到什么？
- **Options：** `a` “种子长出小根和小芽。”；`b` “植株结出豆荚。”；`c` “花朵完全开放。”
- **作者答案键：** `CorrectOptionId: "a"`
- **答案解释：** 萌发开始时，种子会长出小根和小芽；开花和结籽发生在植株长大以后。

#### S2 · 多选（`multiple-select`）

- **目标：** 识别幼苗继续生长的常见需要。
- **学生题面：** 选择有助于幼苗继续健康生长的条件。选出所有合适答案。
- **Options：** `a` “有适量的水。”；`b` “叶子能得到适合这种植物的光。”；`c` “有空气和生长空间。”；`d` “一直放在密闭盒子里，不让空气进出。”
- **作者答案键：** `CorrectOptionIds: ["a", "b", "c"]`
- **答案解释：** 植物生长通常需要水、光、空气和空间；具体需要量会因植物而异。密闭环境不提供适宜的空气交换。

#### S3 · 排序（`ordering`）

- **目标：** 按豆类植物的一个常见观察过程排列阶段。
- **学生题面：** 按这盆豆类植物的观察记录排列阶段。为避免把子叶和真叶混在一起，本题把“展开第一对真叶”定义为第三个观察点。
- **Options（初始顺序）：** `成熟豆株开花后结出豆荚` (`o1`)、`豆苗展开第一对真叶` (`o2`)、`豆子开始萌发，胚根尖出现` (`o3`)、`豆苗的嫩芽突破土面，子叶可见` (`o4`)
- **作者答案键：** `CorrectSequenceIds: ["o3", "o4", "o2", "o1"]`
- **答案解释：** 观察顺序定义为：胚根尖出现（开始萌发）→ 嫩芽突破土面（子叶可见）→ 第一对真叶展开 → 成熟植株开花后结出豆荚。这样不会把可能在相近时间出现的泛称“第一批叶子”误作独立阶段，也不会把子叶当成真叶。题目限定一盆豆类植物的观察记录，不泛称所有植物的完整生命周期。
- **唯一性检查：** 四个阶段是按明确定义的可观察里程碑排列；初始顺序不同于答案顺序，所有选项 ID 各用一次。实际试教时应由教师确认选取的豆种/观察记录符合这组时间顺序。

#### S4 · 配对（`matching`）

- **目标：** 将植物结构与入门层级的主要作用对应。
- **学生题面 / 左列：** `l1` “根”；`l2` “茎”；`l3` “叶”
- **学生题面 / 右列（派生的 `MatchTargets`）：** `r1` “把水输送到植物的其他部分，并支撑植株”；`r2` “吸收水分，并帮助植物固定在生长位置”；`r3` “利用光帮助植物制造食物”
- **作者请求字段 `MatchingPairs`：** `[{Left:{Id:"l1",Label:"根"},Right:{Id:"r2",Label:"吸收水分，并帮助植物固定在生长位置"}},{Left:{Id:"l2",Label:"茎"},Right:{Id:"r1",Label:"把水输送到植物的其他部分，并支撑植株"}},{Left:{Id:"l3",Label:"叶"},Right:{Id:"r3",Label:"利用光帮助植物制造食物"}}]`
- **答案解释：** 根帮助吸水和固定；茎支撑植株并参与水分输送；叶能接收光并进行制造糖分的过程。本题省略花、果实等其他结构。

#### S5 · 判断（`true-false`）

- **目标：** 区分种子萌发和叶片后续生长对光的关系。
- **学生题面：** 豆子刚开始萌发前，必须先让种子见到阳光。
- **作者答案键：** `CorrectBooleanAnswer: false`
- **答案解释：** 不一定。许多种子可以在没有光的情况下开始萌发，因为种子有储存的养分；植物长出叶子后仍需要适合的光照继续生长。种子种类不同，萌发条件也可能不同。

#### S6 · 文本填空（`fill-blank`, `fillMode: "text"`）

- **目标：** 记住种子开始生长的过程名称。
- **学生题面：** 一粒种子开始长出小根和小芽，这个开始生长的过程叫作 ______。
- **作者答案键：** `AllowedTextAnswers: ["萌发"]`；建议 `TrimTextAnswers: true`
- **答案解释：** 种子开始生长、形成根或芽的过程称为“萌发”。本题只接受教材用语“萌发”；若课程所在地区常用其他译词，教师审核时应补充等价答案。

---

## 画布作品试点（原创草案，待教师审核）

这些活动使用正式作业现有的 `photo-response`：教师写明题目与人工评分要求，学生选择屏幕画布或照片；不是 guided 客观题，也不会在保存作品时自动判对。可以先用一句口头示范帮助低龄学生理解操作。保存后显示待教师查看，成绩继续遵守人工评分和结果发布流程。

| 学科与目标 | 学生题面 | 教师观察重点 |
| --- | --- | --- |
| 华文：临写与字形观察 | 看着“木”，在画布上写一遍。再圈出你觉得写得最好的一笔。也可以在纸上写后拍照。 | 这是有范字的临写；观察字形和表达，不据此判断能独立默写，也不由静态图片推断笔顺。 |
| 数学：等分与分数表征 | 画一个长方形，把它分成两份同样大的部分，再把其中一份涂上斜线。在旁边写出涂了多少。也可以提交纸上作品照片。 | 是否分成同样大的两份、是否只标记一份、能否把图与二分之一联系起来；画得漂亮不作为概念理解标准。 |
| 科学：豆苗观察记录 | 观察老师提供的豆苗，画出你看到的根、茎和叶，并在旁边写名称。也可以提交纸上作品照片。 | 根据实际观察识别结构；允许简笔图。教师先确认样本和已教词汇，不把绘画技巧当科学知识评分。 |

以上内容没有导入、布置或公开发布。教师需根据班级年龄、已学内容与辅助需求调整；涉及真实观察样本的活动，必须先准备样本或已授权材料。

## 教师审核清单

- [ ] 目标年龄 7–9 岁是否适合本班的词汇、数字范围、阅读能力和先备知识？
- [ ] 英文表达是否符合目标英语变体、礼貌语域和实际课堂情境？是否应先用角色扮演或教师朗读引入？
- [ ] 分数图示/术语是否与课程当地对“部分—整体”的表述一致？配对选项是否易读，排序是否只表示同一个整体下的大小关系？
- [ ] 植物阶段是否明确这是豆类示例？是否避免暗示所有种子都必须见光才能萌发？幼苗生长条件的表述是否适合当地科学课程？
- [ ] 每道客观题是否确有唯一预期答案（多选除外），答案键、解释、允许答案和分值是否经过另一位教师独立复核？
- [ ] 题目不靠颜色单独表达信息；未来若配图、录音或实物照片，是否确认来源授权、儿童隐私、替代文本/文字和可访问操作？
- [ ] 正式 assessment 与公开自主练习的发布选项是否按各自 Education 流程选择？本文件不是公开课程材料，也未执行任何生产写入。

## 核验来源

1. [British Council LearnEnglish Kids：How to start teaching kids English at home](https://learnenglishkids.britishcouncil.org/zh-hans/parents/helping-your-child/how-start-teaching-kids-english-home) — 儿童日常英语短语、情境教学；页面未核实发布日期，访问 2026-10-27。
2. [GOV.UK：National curriculum in England: English programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study) — 小学口语沟通与互动目标；页面标注更新于 2014-07-16。仅作参考，不代表本试点对齐英格兰课程。
3. [GOV.UK：National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study) — 等分、简单分数和 `2/4 = 1/2` 等值关系；页面标注更新于 2021-09-28。仅作数学事实核对，不代表课程对齐。
4. [GOV.UK：National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study) — 植物生长需要、观察种子/球茎生长、种子储存养分与光照说明；页面标注更新于 2015-05-06。仅作事实核对，不代表课程对齐。
5. [Royal Horticultural Society：Grow With It support pack](https://www.rhs.org.uk/get-involved/grow-with-it/pdfs/grow-with-it-support-pack.pdf) — 萌发、幼苗、真叶、开花和种子形成的园艺观察指南；页面未核实发布日期，访问 2026-10-27。
6. [Royal Horticultural Society：How plants use light to grow](https://www.rhs.org.uk/advice/understanding-plants/how-plants-use-light-to-grow) — 光合作用与植物利用光、水、二氧化碳制造糖；页面未核实发布日期，访问 2026-10-27。

