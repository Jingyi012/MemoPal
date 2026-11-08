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
| 各种题型的基础样式、选项状态 | `components/question-inputs/questionInputStyles.ts` |

新页面通过 `useLearningStyles()` 取得当前主题与通用样式；组件专属的静态样式通过 `createLearningStyles(theme => ...)` 创建。重复的交互区使用上表已有组件，避免在页面重新实现顶栏、图标按钮和反馈面板。

新增颜色应在 `learningColors.light`／`dark` 同时定义语义角色。主视觉上的文字使用 `heroInk`，普通页面文字使用 `ink`／`inkSoft`；不能以白色常量替代主题色。配对题直接使用 `pairOrange`／`pairCyan` 等角色，不在题型组件按深浅色写颜色值。

手写纸张、笔迹和格线属于保存图片的内容，使用 `learningDocumentColors`，两种主题下均保持白纸深色笔迹。不能随暗色主题反转保存的作答内容。

动态尺寸、卡片位置测量及 SVG 连接几何留在对应组件；这类参数不是全局主题。评分、答案、学习进度及接口继续由各功能拥有，UI 组件不接管业务状态。

`npm run check:mobile` 包含浅／深主题在卡片、配对、反馈、主视觉及按钮上的 WCAG AA 文字对比度检查。
