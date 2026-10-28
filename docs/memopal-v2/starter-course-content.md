# MemoPal starter 课程内容规格：三门可学习的入门课

**用途：** 给普通新用户提供可以直接开始的小学基础多学科课程，而不是要求用户先自己导入需要记忆的知识。三个短课分别练英文日常礼貌请求、分数的等份概念、豆类种子的萌发生长。记忆宫殿、Number Peg 与故事联想可作为之后可选辅助，不是开始本课的门槛。

**内容状态：** 原创首方 starter 内容规格，已转为 `EducationStarterCatalog.v1.json` 初始化数据并通过隔离数据库/API 测试；运行中的内容以数据库为准，后台修改不由 seed 覆盖。本轮未连接业务数据库或部署生产，也未完成教师审核。题干、选项、情境和解释均由 MemoPal 原创；来源用于事实核对，不复用其题目、媒体或段落。资料没有背书 MemoPal 课程。用户年龄、地区、先备知识各异，因此这里不标“适合某年龄”也不冒称对齐国家/地区课程。建议上线前由内容编辑复核英语变体与科学表述。

## 内容承载建议

为每门课创建一个 Course + 一个 Objective + 一个可自主完成的 guided lesson。下面每个活动给稳定的示意 ID；实际 CourseId、ObjectiveId 由系统创建后填入。六种题型均用现有客观题：single-choice、multiple-select、ordering、matching、true-false、fill-blank。答案解释为学习者反馈素材，不是答案键字段；需要遵守当前 learner-safe question 投影和服务端评分流程。表格中的选项短 ID 在题目内唯一；ordering 的选项顺序刻意打乱答案；matching 用独立左右项建立唯一配对。该规格不是直接 API JSON，也不包含作者 DTO 所需的全部字段、分值或 session 配置。

字段映射约定：A/B/C/D、p1…p6、o1…o3、L1…/R1… 是作者使用的 option ID，后面的文字是 label；课程题目 ID 在 API 创建时可让服务端生成，不把示意内容 ID 当成已有数据库 ID。单选键对应 CorrectOptionId，多选键对应 CorrectOptionIds，排序对应 CorrectSequenceIds，配对对应 MatchingPairs 的 Left/Right，判断对应 CorrectBooleanAnswer，文本填空对应 FillMode=text 与 AllowedTextAnswers，数值填空对应 FillMode=number、AllowedNumericAnswers 和 NumericTolerance。解释字段对应 Explanation。每道题还需要当前 DTO 中的 Prompt、Type、MaxScore、ObjectiveId 等字段。

## 课程 1：英语礼貌提出请求

**课程目标：** 在借用物品、请求物品的常见场景中，认出或组成礼貌请求，并在收到帮助后表达感谢。

**短讲解（学习者可见）：**

想暂时借同伴的尺子，可以问：“Can I borrow your ruler, please?” “Can I borrow …?” 表示询问能否暂时借来使用；句尾加 “please” 会让请求听起来更礼貌。若请求别人给一件东西，可以说：“Can I have some water, please?” 对方可以回答 “Sure.” 或 “Here you are.” 得到帮助后，可以说 “Thank you.” 日常英语还有其他礼貌说法；本课练习这些常用例句，不把某一种句式说成唯一正确表达。

事实核对来源：British Council LearnEnglish Kids 建议用日常情境和短、变化的活动教儿童英语，举例列出 please、thank you、Can I have …? 等课堂/家庭短语；页面无明确发布日期，访问 2026-10-27。英格兰 DfE 英语课程对小学口语交流、互动与角色扮演的描述仅用于核查语言情境方向，不代表本课对齐该课程。[British Council LearnEnglish Kids: How to start teaching kids English at home](https://learnenglishkids.britishcouncil.org/parents/helping-your-child/how-start-teaching-kids-english-home)；[GOV.UK: National curriculum in England: English programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study)（页面标注更新 2014-07-16）。

### 活动

| ID / 类型 | 学生题面与选项 | 正确答案（作者用） | 反馈解释 |
| --- | --- | --- | --- |
| en-request-01 · single-choice | Mia 想暂时借同学的铅笔。哪句话最礼貌地提出请求？A. “Can I borrow your pencil, please?” B. “Give me your pencil now.” C. “Pencil. Now.” | A | “Can I borrow …?” 是请求暂时借用；“please”使语气更礼貌。B 像命令，C 不完整。 |
| en-request-02 · multiple-select | 选出适合礼貌请求的句子。A. “May I borrow your ruler, please?” B. “Can I have some water, please?” C. “Give me water!” | A、B | A、B 用问句提出请求；C 是命令。礼貌并不只靠出现 please，但本题两个礼貌例句都用了 please。 |
| en-request-03 · ordering | 把词块排成一句礼貌的借尺子请求。初始词块：please? (p1) / your (p2) / Can (p3) / ruler, (p4) / borrow (p5) / I (p6) | p3 → p6 → p5 → p2 → p4 → p1 | “Can I borrow your ruler, please?” 组成清楚的问句，所有块各用一次；标点已包含在相应词块。 |
| en-request-04 · matching | 配对请求与说话者想做的事。左：L1 “Can I borrow your ruler, please?”；L2 “Can I have some water, please?”。右：R1 “我想请你给我一些水。”；R2 “我想暂时借用你的尺子。” | L1–R2；L2–R1 | borrow 是暂时借来使用；have some water 在此处是请求对方给一些水。 |
| en-request-05 · true-false | 朋友把尺子借给你后，说 “Thank you.” 是合适的回应。 | True | “Thank you.” 可用于感谢别人给予的帮助。 |
| en-request-06 · fill-blank（text） | 用本课中表示“暂时借来使用、之后会归还”的词填空：Can I ___ your ruler, please? | borrow | borrow 表示暂时借来使用；use 虽可在其他语境中成立，但题目明确要求回忆本课指定词语 borrow。 |

## 课程 2：同一个整体的四分之一、一半和四分之三

**课程目标：** 知道分数中的等份必须大小相同；用 1/2、1/4、3/4 表示同一个整体的部分；通过数量平均分求简单分数的值。

**短讲解（学习者可见）：**

分数说的是一个整体被平均分后取了几份。每一份必须一样大。若一条同样长的巧克力平均分成 4 份，取 1 份是 1/4，取 3 份是 3/4。若这个相同的整体平均分成 2 份，取 1 份是 1/2；所以同一个整体的 2/4 与 1/2 一样大。求 12 颗葡萄的 1/4，可以把 12 平均分成 4 组，每组 3 颗。

事实核对来源：英格兰 DfE 数学课程 Year 1 明确包含把一半看作两个等份中的一个、四分之一看作四等份中的一个；Year 2 则包含 1/3、1/4、2/4、3/4，求简单数量的分数（如 1/2 of 6），以及 2/4 与 1/2 的等价关系。此处只准确记录来源中的年级安排以便核查，并不表示本课对齐英格兰或任何地区年级课程。[GOV.UK: National curriculum in England: mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study)（页面标注更新 2021-09-28）。

### 活动

| ID / 类型 | 学生题面与选项 | 正确答案（作者用） | 反馈解释 |
| --- | --- | --- | --- |
| fractions-01 · single-choice | 一条巧克力作为一个完整整体，被平均分成 4 块，涂色 3 块。涂色部分是哪一个分数？A. 3/4 B. 1/4 C. 4/3 | A | 整体共有 4 个等份，选中 3 份，所以是 3/4。 |
| fractions-02 · multiple-select | 选出表示同一整体“一半”的描述。A. 两个一样大的部分中取 1 个。B. 四个一样大的部分中取 2 个。C. 四个一样大的部分中取 1 个。 | A、B | A 是 1/2；B 是 2/4。两者都是相同整体的一半。C 是 1/4。 |
| fractions-03 · ordering | 三个完整蛋糕大小相同。从这三个同样大小的整体中分别取 1/4、1/2、3/4；把所取份量从少到多排列。初始选项：3/4 (o1)、1/4 (o2)、1/2 (o3)。 | o2 → o3 → o1 | 因为分数都以同样大小的整体为单位，1/4 < 1/2 < 3/4。 |
| fractions-04 · matching | 左：L1 1/2；L2 1/4；L3 3/4。右：R1 “四个同样大小的部分中取三个”；R2 “两个同样大小的部分中取一个”；R3 “四个同样大小的部分中取一个”。 | L1–R2；L2–R3；L3–R1 | 分母表示整体平均分的份数，分子表示取的份数；每个文字描述仅对应一个分数。 |
| fractions-05 · true-false | 两个同样大小的整体中各取 1/2，所取份量一定相同。 | True | 1/2 是每个完整整体的一半；前提是两整体大小相同。若整体大小不同，半份的实际大小可能不同。 |
| fractions-06 · fill-blank（number） | 12 颗葡萄平均分成 4 组，每组 ___ 颗。 | 3 | 12 ÷ 4 = 3。题目明确平均分成四组并问每组数量，所以答案是 3。建议作者字段 AllowedNumericAnswers=[3], NumericTolerance=0。 |

**答案歧义控制：** fractions-03 明确所有取量来自三个大小相同的完整蛋糕；不能省略该前提。fractions-05 也明示“两个同样大小的整体”，否则“半份相同”不一定成立。画图/颜色不是题目作答必要信息，视觉材料如未来添加须同时提供文本描述。

## 课程 3：豆子种子怎样开始生长

**课程目标：** 描述一粒豆子开始萌发时的迹象；用指定观察记录排列一个豆类幼苗的若干阶段；认识幼苗生长需要合适的水、光和温度等条件，以及根、茎、叶的基本作用。

**短讲解（学习者可见）：**

豆子在合适条件下吸水后会开始萌发，常能看到根先从种子伸出，之后芽继续生长。豆苗长出第一对真正的叶子后，会继续长大；成熟的豆类植物可能开花并形成豆荚和种子。植物生长需要合适的水、光和温度；不同植物需要的条件会不同。叶子能帮助植物利用光制造食物，根帮助固定并吸收水分，茎支撑植物并帮助水分运输。多数种子开始萌发时不需要光，因为种子内部储存有食物；长出叶片后，植物仍需要适合它的光照继续健康生长。

事实核对来源：英格兰 DfE 科学课程要求观察种子/球茎长成成熟植物，植物需要水、光和合适温度；其说明指出种子和球茎需要水，但多数萌发时不需要光，因为内部储存有食物。课程对根、茎、叶结构功能作了入门描述；RHS 进一步说明根吸收水分、茎内木质部运输水分，叶片利用光进行光合作用。RHS 指南区分萌发时幼小子叶与之后的真叶。这里只作为事实核查，不声称本课对齐英格兰或其他官方课程。[GOV.UK: National curriculum in England: science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study)（页面标注更新 2015-05-06）；[RHS: Grow With It support pack](https://www.rhs.org.uk/get-involved/grow-with-it/pdfs/grow-with-it-support-pack.pdf)、[How plants absorb water](https://www.rhs.org.uk/advice/understanding-plants/how-plants-absorb-water)、[How plants use light for growth](https://www.rhs.org.uk/advice/understanding-plants/how-plants-use-light-to-grow)（均未核实明确发布日期）。访问日期均为 2026-10-27。

### 活动

| ID / 类型 | 学生题面与选项 | 正确答案（作者用） | 反馈解释 |
| --- | --- | --- | --- |
| plants-01 · single-choice | 一粒豆子刚开始萌发时，最早可能观察到什么？A. 种子里先伸出小根。B. 长出花朵。C. 结出豆荚。 | A | 种子萌发开始时会长出根和芽；开花与结豆荚是植株长大以后的阶段。 |
| plants-02 · multiple-select | 选出帮助豆苗继续健康生长的条件。A. 适量的水。B. 适合这种豆苗的光照。C. 适合这种豆苗的温度。D. 完全不给它水。 | A、B、C | 植物需要合适的水、光和温度；没有水不能持续健康生长。不同植物的需要会有差异。 |
| plants-03 · ordering | 按这盆豆类植物的观察日志排序。日志明确记录以下节点：根尖从种子出现；豆苗嫩芽突破土面且子叶可见；第一对真叶展开；成熟植株开花后形成豆荚。初始选项：成熟植株开花后形成豆荚 (o1)、第一对真叶展开 (o2)、根尖出现 (o3)、嫩芽突破土面且子叶可见 (o4)。 | o3 → o4 → o2 → o1 | 依照题目规定的四个观察节点，根尖出现先于出土，子叶与真叶是不同阶段，真叶展开后才到开花结荚。这里排序的是一份具体豆苗观察记录，不宣称所有植物都按完全相同速度生长。 |
| plants-04 · matching | 配对植物部分与主要作用。左：L1 根；L2 茎；L3 叶。右：R1 帮助植物利用光制造食物；R2 支撑植株并帮助水分运输；R3 帮助植物固定并吸收水分。 | L1–R3；L2–R2；L3–R1 | 根帮助固定和吸水；茎支撑并运输水分；叶子帮助植物利用光制造食物。 |
| plants-05 · true-false | 大多数种子在开始萌发前都必须先照到阳光。 | False | 多数种子萌发时不需要光，种子内部储存的养分可以支持萌发初期；植物长出叶子后仍需要合适光照生长。不同种类可能有差异。 |
| plants-06 · fill-blank（text） | 种子在合适条件下开始长出根或芽的过程称为种子___。 | 萌发；可接受“发芽” | “萌发”或“发芽”都能表达种子开始生长。建议作者字段 AllowedTextAnswers=["萌发","发芽"], TrimTextAnswers=true。 |

**科学歧义控制：** plants-03 把“胚根/根尖出现、子叶出土、真叶展开、开花形成豆荚”定义为一盆豆苗的观察日志记录；发布时作者应确认所选豆种素材/观察序列相符。若实际使用含种皮留土或地下子叶的豆种图像，不能继续把“子叶突破土面”作为通用阶段，需替换题面与顺序。避免把“多数种子萌发时不需要光”简化成“所有种子永远不需要光”。

## 发布前数据质量门槛

- 本文 18 题各有稳定唯一题目 ID；具体 objective ID 在创建 Course/Objective 后由系统生成，并由所有题目引用同一个新 objective。
- 六种题型各 3 道；确认当前后端枚举/authoring validator 与客户端支持范围一致。排序每个选项 ID 只用一次且初始化顺序不等于答案；配对左右项数量相同、每项只出现一次；选择题答案 ID 与选项一一对应。
- 数学的比较题必须声明同一完整整体大小；分数符号的 numerator/denominator 描述不能因语言翻译歧义失真；number fill 输入接受数值 3 且 tolerance 0。
- 英文使用常见、语法正确的句式，答案键不暗示所有礼貌请求都必须带 please。
- 科学讲解中的 water/light/temperature 用“合适的”或“多数”等限定，避免把萌发光照要求绝对化；根、茎、叶作用维持入门级描述，不把“土壤”说成制造植物食物的来源。
- 学生端只收安全题面、选项与规则允许的解释；答案键仅用于服务端检查/结果发布。导入需走现有课程/学习 session authoring 流程，不能创建 formal assignment 或改用 practice-attempt 数据模型。
- 本文件提供原创文字内容，不附带图片、音频或第三方媒体；以后加素材时单独核权并提供非视觉/非音频替代。
- 课程可以作为游客/新用户可见的 default starter 路径，但能否匿名学习、何时建立账号、课程进度存储、locale 与地区课程标签均应沿用产品已有身份/权限设计单独决定；本规格不推导任何新权限规则。

## 来源日期与使用范围

- [British Council LearnEnglish Kids](https://learnenglishkids.britishcouncil.org/parents/helping-your-child/how-start-teaching-kids-english-home)：页面无明确发布日期；访问 2026-10-27。用于常见儿童请求短语和情境练习方向。
- [GOV.UK English programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study)：页面标注更新 2014-07-16；访问 2026-10-27。仅核查沟通目标。
- [GOV.UK Mathematics programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study)：页面标注更新 2021-09-28；访问 2026-10-27。核查等份、常见分数和等值事实。
- [GOV.UK Science programmes of study](https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study)：页面标注更新 2015-05-06；访问 2026-10-27。核查植物生长、萌发与条件。
- [RHS Grow With It support pack (PDF)](https://www.rhs.org.uk/get-involved/grow-with-it/pdfs/grow-with-it-support-pack.pdf)：PDF 页面未标明确发布日期；访问 2026-10-27。核查萌发、子叶、真叶阶段差别。
- [RHS How plants absorb water](https://www.rhs.org.uk/advice/understanding-plants/how-plants-absorb-water) 与 [How plants use light for growth](https://www.rhs.org.uk/advice/understanding-plants/how-plants-use-light-to-grow)：未核实明确发布日期；访问 2026-10-27。核查根吸水、茎运输水分与叶片利用光制造糖的简化说明。

**不作出的声明：** 这三门 starter 是原创入门材料，尚未经过教师审核或审定；它们不是官方教材摘编、已认证教学法、特定地区课纲覆盖、学习效果证据，也不是生产系统中已存在的课程。导入和启用需由产品内容所有者按平台工作流完成。

