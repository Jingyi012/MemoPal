# 学习内容的配置来源

课程内容使用数据库及已发布的 API 数据，不由手机端拼出固定课程。官方预置课程只在缺失时初始化；已有课程、管理员修改或下架不会被启动种子覆盖。

| 内容 | Admin 入口 | 手机端来源 |
| --- | --- | --- |
| 课程名称、学科、阶段、语言、公开状态 | Learning Studio → Courses → Course settings | Public course DTO |
| 单元名称、知识点归属及顺序 | Courses → Units & path | Course outline / units |
| 知识点名称 | Courses → Learning objectives → Manage content → Knowledge point title | Objective DTO；新增修改入口 |
| 学习资料正文、解释、拼音、补充说明及朗读语言 | 知识点 → Study content → Add item / 编辑草稿 | Published learner study items |
| 分数初始涂色／等份数、图形及边数、规律顺序 | 同一学习资料表单 → Interactive teaching diagram | 保存在既有 mediaRef，API 只公开批准的 illustrationCode |
| 题干、选项、正确答案、解析、题目次序及知识点关联 | Courses → Assessments → 编辑题目 | Assessment / guided session；正确答案仍由服务端控制 |
| 推荐记忆练习 | 知识点 → Recommended memory practice | Objective recommended memory set |
| 记忆练习的词条、答案及联想内容 | 对应记忆集合／内容管理 | Memory set API |

## 发布流程

1. 创建或选择课程，在单元路径中安排知识点。
2. 进入知识点配置名称、学习资料和可选图示。教学文字使用正文／解释／补充说明字段，不写入手机组件。
3. 已发布资料需要先 Withdraw，再编辑、保存、Publish。学习端只读取已发布数据。`extra` 为公开补充内容；作者私有 `hint` 和原始媒体引用不在 learner DTO 公开。
4. 在 Assessments 中配置题目、答案和解析，再发布为公开练习；课程也需公开发布后才能出现在公开课程列表。

## 图示协议与复用边界

`shared/education/studyIllustrations.ts` 被手机和 Admin 共用。后端 `EducationStudyIllustrations` 验证同一协议，只有允许的公开图示可投影，任意 URL／私有媒体不会因配置图示而泄露。

- 分数：`media:learning-fraction-3-7` 表示初始涂3份、整体7等份。支持2–12等份、涂色0至总份数。大份数横向滚动，避免压缩点击区域。
- 图形：圆／三角形／正方形，以及 `media:learning-shape-polygon-5`。规则多边形支持3–8边，保持角节点点击区域。
- 规律：`media:learning-pattern-blue-square-red-red`。支持2–8个符号，重复项及顺序保留。符号类型为 red／blue／circle／triangle／square。
- 旧版 half／quarter／three-quarters 及原图示代码继续兼容，不要求改动已发布的课程。

按钮、导航、状态提示、通用图形绘制与题型交互属于软件组件，不是课程知识。新增一种全新的题型或绘图能力仍需开发；新增或修改课程、例子参数、题目与教学说明使用 Admin。图示配置可通过上述表单或学习资料 JSON 导入；既有 CSV 模板不包含图示列。

## 本轮验证

- Admin 未保存表单实测：分数可设置为3/7，随后取消，没有改写现有课程。
- API 集成测试：草稿编辑后的自定义分数／多边形／规律可发布并安全读取，非法图示拒绝，知识点改名校验所有权和空标题。
- 手机及 Admin 共用协议解析测试；后台表单保存、重复符号、预览自定义参数与保存失败保留草稿均有测试。
- 新接口和图示公开协议需要运行新的后端版本；本轮使用隔离构建目录测试，没有停止或替换 Visual Studio 中正在运行的 API。共享模块新增了 Metro watchFolders 配置，原有 Expo 也需要重启。临时验证用的 Admin／8082 Expo 已停止，未保存示例课程数据。

验收结果：手机179项测试；Admin完整61项及新增标题／自定义预览用例通过；后端354项单元、126项集成通过，5项需要PostgreSQL环境的测试跳过。Web导出通过。Admin示例表单截图 `C:/Users/jingy/AppData/Local/Temp/memopal-admin-teaching-diagram-config.png`；手机自定义图示截图为临时参数样例，路由已删除。
