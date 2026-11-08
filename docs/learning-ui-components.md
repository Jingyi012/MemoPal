# 学习模块 UI 复用入口

学习模块使用手机现有的浅色／深色设置，不单独维护 theme provider。

| 调整内容 | 维护位置 |
| --- | --- |
| 语义颜色、配对色、主视觉、浮层遮罩 | `apps/mobile/src/features/education/theme/learningTokens.ts` 的 `learningColors` |
| 常用间距、圆角、点击区域、边框厚度 | 同文件 `learningLayout` |
| 字号及行高 | 同文件 `learningTypeScale` |
| 字体及主题样式工厂 | `theme/learningTheme.ts` 的 `learningTypography`、`createLearningStyles` |
| 通用卡片、正文、标题、底部区样式 | `components/LearningUi.tsx` 的 `useLearningStyles` |
| 主／次／成功／错误按钮、进度条和入场动画 | `LearningButton`、`LearningProgress`、`LearningArrival` |
| 44pt 图标按钮 | `components/LearningIconButton.tsx`；plain／outlined 两种外观，已用于导航、首页快捷入口和朗读 |
| 题目进度顶栏、底部反馈容器 | `components/LearningQuizLayout.tsx`；guided 和普通练习共同使用 |
| 对错提示、正确答案及长解析滚动 | `components/LearningFeedback.tsx` |
| 学习要点、读音、释义及补充提示的统一卡片 | `components/LearningStudyContentCard.tsx`；由公共／课堂学习共用的 `LearningStudySession` 使用 |
| 各种题型的基础样式、选项状态 | `components/question-inputs/questionInputStyles.ts` |

新页面通过 `useLearningStyles()` 取得当前主题与通用样式；组件专属的静态样式通过 `createLearningStyles(theme => ...)` 创建。重复的交互区使用上表已有组件，避免在页面重新实现顶栏、图标按钮和反馈面板。

新增颜色应在 `learningColors.light`／`dark` 同时定义语义角色。主视觉上的文字使用 `heroInk`，普通页面文字使用 `ink`／`inkSoft`；不能以白色常量替代主题色。配对题直接使用 `pairOrange`／`pairCyan` 等角色，不在题型组件按深浅色写颜色值。

手写纸张、笔迹和格线属于保存图片的内容，使用 `learningDocumentColors`，两种主题下均保持白纸深色笔迹。不能随暗色主题反转保存的作答内容。

动态尺寸、卡片位置测量及 SVG 连接几何留在对应组件；这类参数不是全局主题。评分、答案、学习进度及接口继续由各功能拥有，UI 组件不接管业务状态。

学习内容卡片使用纯色主题标题栏和纸张色正文区。Admin 的 `primary`／`phonetic`／`secondary`／`extra` 在同一卡片内依次呈现；空字段及重复内容不产生空区块。互动图示位于卡片后，继续由 Admin 配置数据控制。首张卡片的下一步按钮全宽，后续卡片的上一步／下一步左右排列。

`npm run check:mobile` 包含浅／深主题在卡片、配对、反馈、主视觉及按钮上的 WCAG AA 文字对比度检查。

## 私人课程与卡片学习的统一布局

- `LearningCourseHero` 由公开课程和私人课程共用；私人页复用
  `LearningCourseUnits` / `LearningCoursePath`，显示单元、真实词语预览及底部主操作。
  学习卡片与单元数量来自接口，有练习时才显示服务器答题进度。
- `LearningStudySession` 使用完整高度的学习舞台、单元位置、沫沫提示和
  `LearningStudyNavigator`。卡片导航只切换本地阅读位置，不写入掌握度或分数。
- 简短的 `LanguageItem` 通过 `LearningWordCard` 居中显示词语、原有音标与释义。
  有释义时可以展开／收起；没有释义时不生成假内容。朗读继续复用
  `LearningReadAloud`，使用原有队列、离开停止和错误提示。
- 长段说明和教学图示继续使用原有内容卡和互动图示。图示配置仍来自 Admin。
  所有新界面使用学习主题颜色、原有字体与伙伴素材，没有新增图片或依赖。

本次布局验证：手机端类型检查、Lint（仅原有 5 条警告）及 189 项测试通过；
Android 生产资源导出通过。现有 Android 模拟器核对了私人课程概览、卡片阅读、
单元内横向导航和左右翻页。首张导航卡片的裁切与内容／图示重复 key 已修正。

## 我的学习内容：私人书架

列表采用纯色紫色概览、沫沫伙伴、搜索、全部／可学习／草稿筛选和书本封面卡片。
`PersonalStudyShelfCard` 与 `personalStudyLibraryStyles` 复用学习主题、字体和按压组件；
没有增加图片或依赖。数量、语言及状态都来自私人课程接口，不生成学习进度。
可以学习的内容进入私人课程，草稿继续原有编辑流程；空状态提供恢复筛选或添加内容。

设计参考 [Quizlet 的学习资料组织方式](https://help.quizlet.com/hc/en-ca/articles/360030986151-Organizing-study-content-with-folders)
及 [Duolingo 按学习目标选择练习的方式](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)，
在当前功能范围内应用资料浏览和明确行动的思路，没有引入文件夹或新的业务规则。

学习首页的课程列表使用 `LearningCatalogCourseCard`：浅色学科封面显示图标、学科、
作者和已有收藏状态；纸张色正文突出课程名、适用阶段和真实练习／题目数量。
底部将服务器进度和单一课程入口放在一起；可显示探索、继续或再次练习，仍进入
原有课程详情。进度加载或失败时保留入口，不显示虚假的未开始状态。
卡片专属样式通过 `createLearningStyles` 管理，复用学科图标、进度条、字体和按压动画，
不用渐变或新增图片。窄屏与长文本通过换行和弹性布局适配。
