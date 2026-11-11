# 学习模块 UI 复用入口

学习模块使用手机现有的浅色／深色设置，不单独维护 theme provider。
全局样式以 [Mobile shared styles](mobile-design-system.md) 为准；学习模块不再维护另一套字号、字体、基础颜色或按钮实现。

| 调整内容 | 维护位置 |
| --- | --- |
| 基础语义颜色 | `apps/mobile/src/theme/memopalTheme.ts` |
| 配对色、主视觉、浮层遮罩 | `apps/mobile/src/features/education/theme/learningTokens.ts` 的 `learningColors` |
| 常用间距、圆角、点击区域、边框厚度 | `apps/mobile/src/theme/designSystem.ts`；`learningLayout` 为兼容别名 |
| 字体、字号及行高 | 同文件 `appTextStyles`、`fontFamilies`；`learningTypeScale` / `learningTypography` 为兼容别名 |
| 主题样式工厂 | `theme/learningTheme.ts` 的 `createLearningStyles` |
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

## 我的学习资料：统一书架

列表采用纯色紫色概览、沫沫伙伴、搜索、全部／我创建的／已收藏／草稿筛选。
`LearningLibraryCard` 与 `personalStudyLibraryStyles` 复用学习主题、字体和按压组件；
没有增加图片或依赖。数量、语言及状态来自私人课程和收藏接口，不生成学习进度。
可以学习的自建内容进入私人课程，草稿继续编辑，收藏课程进入公开学习路径。
每张卡片有独立的移除按钮，自建内容删除和取消收藏分别说明，确认后才提交。
空状态提供恢复筛选、添加内容或探索课程。旧收藏链接进入同一书架的已收藏筛选。
自建与收藏使用同一白底书本卡片。书架右侧切换列表／双列卡片；双列按实际容器宽度均分，
奇数末项保持单格宽度。两种模式共用来源、状态、进度及删除确认，切换保留筛选和搜索。

设计参考 [Quizlet 的学习资料组织方式](https://help.quizlet.com/hc/en-ca/articles/360030986151-Organizing-study-content-with-folders)
及 [Duolingo 按学习目标选择练习的方式](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)，
在当前功能范围内应用资料浏览和明确行动的思路，没有引入文件夹或新的业务规则。

学习首页的课程列表使用 `LearningCatalogCourseCard`：浅色学科封面显示图标、学科、
作者和已有收藏状态；纸张色正文突出课程名、适用阶段和真实练习／题目数量。
底部将服务器进度和单一课程入口放在一起；可显示探索、继续或再次练习，仍进入
原有课程详情。进度加载或失败时保留入口，不显示虚假的未开始状态。
卡片专属样式通过 `createLearningStyles` 管理，复用学科图标、进度条、字体和按压动画，
不用渐变或新增图片。窄屏与长文本通过换行和弹性布局适配。

## 浏览与筛选层级（2026-11-09）

资料库和发现页统一使用 `LearningHeader` 与 `LearningWorkspaceActions`。
工具是页头带文字的紧凑入口；新建菜单明确提供学习内容、记忆练习两条路径。
原记忆库独占一行的工具按钮和资料库内重复悬浮新增按钮已移除。

`LearningWorkspaceNavigation` 改为当前分类下拉，复用 `LearningChoiceMenu` 的底部
选择面板；课程／记忆不再以两个大按钮常驻。课程来源和记忆法／归档筛选也使用
同一面板，按钮持续显示当前筛选。列表／双列视图由一个 44pt 图标切换。
学习偏好在发现页使用 `LearningPreferencesCard inline`，保留配置功能并缩短入口高度。

`LearningLibraryCardSurface` 为课程和 `MemoryLibraryItemCard` 共用的卡片主体：
封面、标题、来源、状态、底部动作和管理按钮使用同一布局与主题。记忆资料仍显示
真实到期时间、归档／草稿状态与原宫殿照片，管理菜单继续调用原有操作。
合集使用紧凑列表呈现，避免大封面把学习资料推到首屏以下。
中文标题补充明确字重，避免西文字体回退后失去标题层级。

设计参考 [Spotify 资料库排序和筛选说明](https://support.spotify.com/al/article/sort-and-filter/)
中对搜索、分类、排序及列表／网格操作的分工；这是 MemoPal 的布局取舍，未照搬其界面。
本轮移动端 196 项测试、类型检查和 lint 通过（原有 5 条警告），Android 资源导出通过。
在 390px Expo Web 核对了分类选择、记忆类型筛选、统一卡片和新建菜单。


### Browse layout refinement (2026-11-09)

- The library Tools action pushes `/memory-tools` on the root stack. This reuses `PracticeScreen` with a back button and no tab navigator; direct entry falls back to Library. The legacy practice route remains available.
- Library surfaces use a quiet single border, consistent typography, distinct content and start actions, and compact status text. Two-column covers use theme tints and retain independent management controls.
- Collection creation belongs beside the collection heading, with a fallback when no collections exist.
- Discover focuses on search and results. Its header exposes the leaderboard; creation remains in Library. Preferences remain accessible inside course filters. Community promotional blocks and the duplicate course shortcut were removed; authoring remains in the footer.
- Verified the tools/back path, category switching and list/grid layouts in a 390px Expo Web preview. Native device interaction remains unverified.
