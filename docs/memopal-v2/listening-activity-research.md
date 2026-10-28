# 听力活动研究：最小可落地路径

研究日期：2026-10-27。范围：只读核对当前仓库、Expo SDK 54 对应源码和一手官方无障碍资料。本文把**现状事实**与**实施提案**分开；提案不是已批准的 API 设计。

## 结论

最小听力活动不需要新增答题类型：用已有 `single-choice` 做听音选择，用已有 `fill-blank`（`fillMode: text`）做简短听音填答，保留服务端评分和引导式课程会话。真正缺少的是一个可供教师编写/选择、对学习者安全返回、按课程权限读取的**题目音频资产**合同。当前的 `voice-response` 是学生录音回答，上传绑定正式作业 attempt/question，不能充当教师题目音频的通用存储接口。

Expo SDK 54 源码分支已有 `expo-audio` 的播放 hook 与状态 hook，仓库已安装 `expo-audio ~1.1.1`，移动端也已有私有录音附件经认证 API 取回后转临时文件/Blob URL 并清理的样例。因此首版可复用现有播放器和私有预览传输模式，不引入新依赖。任何音频加载/播放失败都应停止本题校验，而不是把技术失败记为答错。

## 仓库现状事实

| 层 | 现有实现 | 对听力题的限制 |
| --- | --- | --- |
| 内容/作者合同 | `EducationQuestionRequest` 含 Prompt、Type、选项、答案、解释等字段，但无 question audio；StudyItem request 有 `MediaRef`。见 [EducationAuthoringDtos.cs](../../apps/api/src/MemoPal.Application/Features/Education/Authoring/DTOs/EducationAuthoringDtos.cs#L8)（题目）、[EducationAuthoringDtos.cs 学习条目](../../apps/api/src/MemoPal.Application/Features/Education/Authoring/DTOs/EducationAuthoringDtos.cs#L27)（学习条目）。 | `MediaRef` 不是已验证的音频资产合同。其校验仅要求 `media:<opaque-id>` 形式；未证明关联资产类型、存在、版权或学习者可读。见 [EducationStudyItemValidation.cs](../../apps/api/src/MemoPal.Application/Features/Education/StudyItems/EducationStudyItemValidation.cs#L17) 与 [校验逻辑](../../apps/api/src/MemoPal.Application/Features/Education/StudyItems/EducationStudyItemValidation.cs#L61)。 |
| 学习者材料 | 课堂学习内容从已发布学习条目投影 Primary/Secondary/Phonetic/Extra 等字段；查询没有读取/返回 MediaRef。学习者 DTO 也不包含 MediaRef。见 [GetEducationClassroomLearningContentQuery.cs](../../apps/api/src/MemoPal.Application/Features/Education/GuidedLearning/Queries/GetEducationClassroomLearningContentQuery.cs#L35)、[EducationAuthoringDtos.cs](../../apps/api/src/MemoPal.Application/Features/Education/Authoring/DTOs/EducationAuthoringDtos.cs#L78)。 | 不能仅给现有学习条目填 MediaRef，就认为学习者端会拿到或能播题目音频。 |
| 学习路径与评分 | Classroom 课程页可显示学习条目导入内容，再开始/恢复 guided session；答案走服务端 check。移动 API 已有学习内容、session、恢复、check 方法。见 [EducationClassroomCourseScreen.tsx](../../apps/mobile/src/features/education/screens/EducationClassroomCourseScreen.tsx#L32)、[educationPractice.api.ts](../../apps/mobile/src/features/education/api/educationPractice.api.ts#L46)。 | 这是合适的课内承载流程；无需用正式作业 attempt 伪装课程学习。 |
| 题型/答案 | 已有单选、填空/文本、判断、多选、排序、配对及 written/photo/voice response 等。见 [question.types.ts](../../apps/mobile/src/features/education/types/question.types.ts#L5)、[完整题型联合](../../apps/mobile/src/features/education/types/question.types.ts#L143)。 | 听力选择沿用单选；短答沿用受服务端验证的填空/文本答案，不另造 “listening-answer” 类型。 |
| 已有音频上传/读取 | [EducationAttemptsController.cs](../../apps/api/src/MemoPal.Api/Controllers/EducationAttemptsController.cs#L42) 的音频 endpoint 挂在 attempt/question response 路径；[UploadEducationResponseAttachmentCommand.cs](../../apps/api/src/MemoPal.Application/Features/Education/Attempts/Commands/UploadEducationResponseAttachmentCommand.cs#L18) 将音频关联当前学生回答并存私有附件。读取也以 attempt 与 question 为边界。 | 此合同的所有者和生命周期是学生作答附件，不是教师制作并跨学习者复用的题干媒体。不要重用该上传路由来存课程音频。 |
| 公共媒体 | [MediaController.cs](../../apps/api/src/MemoPal.Api/Controllers/MediaController.cs#L13) 与 [AdminMediaController.cs](../../apps/api/src/MemoPal.Api/Controllers/AdminMediaController.cs#L14) 仅接受 JPG/JPEG/PNG/WebP 图片，返回绝对媒体 URL。 | 现有 public media 上传不是音频资产服务。现有公开 URL 模式也不适合未经明确公开许可的课堂音频。 |
| 移动播放器基础 | [package.json](../../apps/mobile/package.json#L37) 安装 `expo-audio ~1.1.1`；[VoiceResponseInput.tsx](../../apps/mobile/src/features/education/components/question-inputs/VoiceResponseInput.tsx#L2) 使用 `useAudioPlayer` / `useAudioPlayerStatus`。私有预览样例 [educationVoicePreview.service.ts](../../apps/mobile/src/features/education/services/educationVoicePreview.service.ts#L1) 通过认证 API 下载，再为 Web 建 Blob URL、为原生端写 cache 文件，结束时清理。 | 播放器能力已经有；课程题面取音频的元数据、权限与 API 仍未实现。 |

## Expo 54 与无障碍的一手核对

- 仓库声明 Expo Audio 版本约束为 `~1.1.1`。Expo SDK 54 正式发布日为 **2025-09-10**（[Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54)）。Expo SDK 54 源码分支中的 [`expo-audio` ExpoAudio.ts](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/src/ExpoAudio.ts#L1316) 明确将音源定义为本地资源、远端 URL 或空值；暴露生命周期托管的 `useAudioPlayer`、`useAudioPlayerStatus`，播放器有 play/pause/replace/seek 等方法。对应 [类型定义](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/src/AudioModule.types.ts#L959) 具备状态字段，含加载、缓冲、时长和播放状态。Expo 源码 changelog 标出 `expo-audio 1.1.1` 为 **2025-12-17**（[SDK 54 分支 changelog](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/CHANGELOG.md#L207)）；仓库版本声明不锁定 npm 实际解析值，实际安装需以 lockfile 为准。
- Expo 的版本化 `/versions/v54.0.0/sdk/audio/` 文档地址目前会重定向到 latest；因此能力判断以 **SDK 54 源码分支**为准，当前文档只作为一般 API 参考：[Expo Audio API](https://docs.expo.dev/versions/latest/sdk/audio/)。该页面未核实到发布日期，访问日期 2026-10-27。不要把 latest 页面说成 SDK 54 的固定文档。
- 官方 [React Native 无障碍文档](https://reactnative.dev/docs/accessibility)说明 VoiceOver/TalkBack 支持、触控元素无障碍暴露及 `accessibilityLabel` 等属性；文档页面未核实到发布日期，访问日期 2026-10-27。项目当前 React Native 版本以移动 package/锁文件为准，必要时用 [RN 0.81 对应文档](https://reactnative.dev/docs/0.81/accessibility)复核属性细节。
- W3C 的 WCAG 2.2 指针手势解释页（[Pointer Gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html)，该材料为解释文档而非规范性文本）要求网页中依赖路径/多点手势的功能提供单指且无需路径手势的操作方式；这可作为 web 端设计参考，不代表对原生应用的合规判定。

## 最小端到端提案

### 内容与媒体合同

1. 保持现有题型与答案合同不变：单选题附选项和正确选项；短听力填空按当前文本答案与归一化规则评分。题目音频是**题干内容**，不要作为学生 answer attachment 或答案字段。
2. 在题目作者合同中增加可选的**媒体资产 opaque ID 引用**（此处仅概念提案，如 `promptAudioAssetId`，不是现有 DTO 字段名），并在作者端提供选择/上传/播放预览、发布前校验。短期可以只做一个音频主资源；剪辑/多段/逐词同步之后再设计。
3. 引入课程题干音频资产记录及专用作者上传/替换/读取路径；由服务端检查扩展名之外的内容类型/文件头、大小、获准格式、所属作者、关联题目、发布状态和内容版本。文件头/MIME 校验不等于实际可解码；若需要服务器确认完整解码，须另选媒体解析/解码方案。元数据至少表达稳定 ID、MIME、长度/大小、可见范围与来源/授权审查状态。技术细节需按现有文件存储接口与实际部署配置再设计。
4. **私有课堂资产**应存私有区域，通过登录鉴权的流/下载 endpoint 获取；每次读取验证当前课堂成员、题目/课程仍发布可读和对应用户权限，返回不暴露路径的短缓存策略。移动端沿用现有 voice preview 的“认证 API → 短生命周期本地文件/Blob URL → 播放 → cleanup”模式。私密文件不直接放到公共静态 `/files` 目录。
5. 现有公开学习控制器仍要求登录，MVP 音频应沿用认证和当前课程读取策略，不新增匿名媒体入口。只有另行明确批准公开分发的课程资产，未来才考虑公众 URL；不能仅因课程/题目是公开练习，就推断音频版权允许公开下载或再分发。优先教师/课程作者原创录音，或经确认允许目标用途的授权录音；记录作者、原始出处、许可及必要署名。不得从视频、歌曲、应用、课本录音中抽取素材或未经许可使用儿童声音。
6. 课程练习可在开始 session 后把题目音频安全引用加入 learner-safe question DTO，且绝不附带正确答案/rubric。下载本身失败或媒体被撤回时，后端正常拒绝并让客户端呈现可重试的媒体错误；不得让旧 session 绕过重新鉴权。

### 播放与无障碍

- 播放需由孩子主动点击/按键启动，不自动播出；提供清晰的“播放/重播”按钮、当前加载/播放/已播放/失败状态，并允许在答题前按教学设计重播。不要依赖自动播放或仅用图标。
- 为 VoiceOver/TalkBack 暴露按钮角色、动作名称、状态；错误和加载完成适度播报，避免播放器每秒时间更新都抢焦点。Web 端可键盘聚焦操作。
- 非听力考查的教学材料可提供逐字稿/字幕。若考查的是听力理解，答题前显示完整文本会改变考查构念；应为需要替代访问方式的孩子提供明确的文本等价练习或教师安排，并将这种不同形式的证据单独标记，不能声称与纯听力成绩等价。音频结束后才显示文本可作为讲解/复习策略，不等同初次听力测验。
- 若播放器不可用、音量/耳机/后台中断或设备拒绝播放，暂停题目并给出重试/文本替代入口；不能把无障碍替代或硬件故障统计成学科错误。

### 适合现有产品边界

课堂已有 classroom course → learning-content → guided session → server check 的流程，MVP 应接这条路径而不是创建新的本地进度模型；公开练习及正式作业继续保持原有权限/成绩语义。先做教师录制的单句/短片段与单选、短文本填答，作者预览、发布和权限读取走通，再扩展图片选项、对白分角色或科学声音等学科活动。不要将“音频题”硬编码为语言学习专属：数学口头题、科学观察音也可复用同一媒体概念，学科目标和评分规则仍须另行定义。

## 建议测试场景

- **跨平台基本播放：** iOS、Android、Web 手动播放、暂停/重播、结束事件/状态；页面切题、退出或卸载后停止旧音频并清理缓存/Blob URL。SDK 源码证明 API 跨平台存在，不等于 MemoPal 当前三端行为已验证；本次没有跑真机或浏览器。
- **媒体故障：** 缓冲、慢网/断网、404/撤回、MIME 与实际文件不符、损坏/不支持格式、下载超时、重复触发播放、页面离开期间下载完成；确保只显示媒体错误且答案 attempt 不被提交/判错。
- **隐私/权限：** 未登录、非班级成员、课程撤回、题目取消发布、素材 ID 猜测、跨课程替换 ID、私有文件 URL 是否能未经授权访问；公开课程素材也沿用现有认证边界。验证 API 不输出本地路径、敏感 query token 或私人缓存。
- **答题与评分：** 音频失败不计有效尝试；音频可以重听而不会新建 session/重复奖励；听力单选与填空仍走现有服务端判分，重试/断网重放保持检查 ID 和会话版本语义。
- **无障碍与儿童体验：** iOS VoiceOver、Android TalkBack、键盘操作（Web）、焦点顺序、播放/重播标签和状态、系统静音/音量较低、耳机断开/电话打断、动态文字和屏幕阅读器不会把答案提前读出。字幕/替代文本在答案前后切换时验证评分定义仍清楚。
- **内容发布：** 音频格式/长度/容量校验；作者上传者不是课程 owner、其他作者替换；题目发布和修改后内容版本/旧 session 的引用策略；缺授权来源/待审核媒体不得发布。

## 一手来源与日期说明

| 来源 | 页面所述日期 | 用途 |
| --- | --- | --- |
| [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) | 2025-09-10 | Expo SDK 发布日 |
| [Expo SDK 54 `expo-audio` source](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/src/ExpoAudio.ts) 与 [types](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/src/AudioModule.types.ts) | 源码页面未显示明确发布日期；访问日期 2026-10-27 | SDK 54 分支播放器 API/状态 |
| [Expo Audio changelog (sdk-54 branch)](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/CHANGELOG.md) | v1.1.1 日期 2025-12-17 | 当前包版本变更记录；非 SDK 54 总发布日期 |
| [Expo Audio API docs](https://docs.expo.dev/versions/latest/sdk/audio/) | 未核实发布日期；访问 2026-10-27 | 仅作为当前文档参考；不是版本化 SDK54 文档 |
| [React Native Accessibility](https://reactnative.dev/docs/accessibility) | 未核实发布日期；访问 2026-10-27 | iOS/Android 辅助技术与属性 |
| [W3C WCAG 2.2 Pointer Gestures Understanding](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html) | 页面版本 WCAG 2.2；此解释页日期未核实；访问 2026-10-27 | Web 复杂手势替代设计参考 |

本研究没有下载第三方音频库、媒体素材或数据集；没有验证现有部署的存储配置、编解码器清单、CDN 缓存策略、教师授权流程或儿童试点效果。相关结论均为代码可见事实、官方 API 资料或明确标注的设计提案，不构成实施完成证明。
## 附录：实施决策与能力边界（2026-10-27）

本附录根据根目录 package-lock 与实际安装包进一步核对。优先给出单一、真实可交付的试点路径；格式转码与 DRM 均属可选后续，不是 MVP 前置条件。

### 已核实的边界

- 根 package-lock.json 将 expo-audio 锁定为 1.1.1，node_modules 中安装版本也是 1.1.1。SDK 54 分支官方 [Audio.types.ts](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/src/Audio.types.ts#L1299) 定义 AudioSource 可为 URL/file URI，并可带 HTTP headers。原生实现把 headers 传入请求：[iOS 源码](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/ios/AudioUtils.swift#L88)、[Android 源码](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/android/src/main/java/expo/modules/audio/AudioModule.kt#L554)。但 Web 实现只从 source 取 URI 并使用 HTMLAudioElement，未将 AudioSource.headers 用于请求（[Web 源码](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/src/AudioModule.web.ts#L305)）。因此不能把 player headers 当作跨平台 Bearer 鉴权合同。Web 跨域要求另见 [类型注释](https://github.com/expo/expo/blob/sdk-54/packages/expo-audio/src/Audio.types.ts#L1328)。
- 文件扩展名、MIME 与音频可解码是不同检查。现有学生附件上传仅读取开头至多 12 bytes：MP3 查 ID3/frame sync，WAV 查 RIFF/WAVE，M4A 查 ftyp，WebM 查 EBML 魔数，再比对声明 MIME（[UploadEducationResponseAttachmentCommand.cs](../../apps/api/src/MemoPal.Application/Features/Education/Attempts/Commands/UploadEducationResponseAttachmentCommand.cs#L98)）。这能拒绝部分误标文件，但不能证明文件完整、有可播放音轨、可解码、codec/profile/sample rate 可用或真实时长；不能把头部 sniff 结果当成解码验证。
- Android 官方媒体表将 MP3 decoder 列为 YES，列出 MP3 容器及 mono/stereo、8–320 kbps CBR/VBR；AAC-LC 支持 MPEG-4 .mp4/.m4a；WAVE 列的是 8/16-bit linear PCM。来源：[Android Supported media formats](https://developer.android.com/media/platform/supported-formats)。页面未核实明确发布日期，访问日期 2026-10-27。
- Apple 归档 Safari 文档列出 AAC、MP3、AIFF、WAVE；其 iOS 归档说明列 MP3、未压缩 WAV/AIF 与 AAC-LC/HE-AAC。来源：[Safari web content archive](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/Introduction/Introduction.html)、[iOS-specific considerations archive](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html)。这些是 Apple 一手归档资料，但不能代表所有当前 Safari/OS/设备或 Expo 原生播放器表现；页面可见内容未核实具体发布日期。
- Web 标准的 canPlayType() 只返回空字符串、maybe 或 probably。它是用户代理对支持情况的信心，不证明某个文件成功解码/发声；实际媒体仍可能因网络、容器、codec 或损坏失败。来源：[WHATWG HTML media](https://html.spec.whatwg.org/multipage/media.html#dom-canplaytype-dev)。该 living standard 未标固定发布日期，访问日期 2026-10-27。
- 本地私有附件存储与 public media root 分离，extension allowlist 含 m4a/mp3/wav/webm；读取返回由存储映射出的 MIME，不是解码器结果，见 [LocalPrivateAttachmentStorage.cs](../../apps/api/src/MemoPal.Infrastructure/Storage/LocalPrivateAttachmentStorage.cs#L9)。现有学生回答附件读取响应设 Cache-Control: private, no-store（[EducationAttemptsController.cs](../../apps/api/src/MemoPal.Api/Controllers/EducationAttemptsController.cs#L58)）。这些是 response attachment 的现有能力，不自动提供课程 prompt audio 读取能力。

### MVP 决策建议

**必要：**

1. 新媒体条目只保存稳定 asset ID、精确 content type、字节长度、私有存储 key、归属内容/版本及审核状态。服务端限制字节数、检查实际签名并确保可取回；这些是格式/边界检查，不是完整解码验证。
2. 试点收窄为一种跨平台目标输出格式，建议 MP3、短时长、单声道、教师原创或明确授权录音。Android 官方表和 Apple Safari 归档均列出 MP3 支持；仍须在产品目标 iOS、Android、Web 浏览器上用试点资产做上传后预览和端到端播放验证。单格式降低内容制作和兼容测试成本；不声称所有历史/低端设备均可播放。
3. MVP 不要求自动转码。作者从受支持的工具输出规定格式并上传，服务端做 size/type/signature 检查，作者端发布前实际播放预览；不能完整播放的资产不可发布。若未来需服务器严格验证 codec/时长，应另选受维护的媒体解析/解码工具并限制 CPU/内存/时长；仅靠 MIME 或 magic bytes 不足。
4. 移动和 Web 统一采用登录后调用课程音频内容 endpoint 下载：服务端每次读取检查当前用户、课堂/课程访问授权、题目发布状态和资产关联，响应 private/no-store。沿用 voice preview 模式：API 客户端带认证取回短音频，Web 用 Blob URL、原生用 app cache 文件交给播放器，离题/退出时主动释放 URL 和临时文件。不走 Web 上不能一致附加 Bearer header 的远端播放器路径。
5. 不必新建匿名 URL、signed URL 或 DRM 才能交付 MVP。撤权可阻止后续下载，但已送到客户端的字节不能被服务端远程撤回或保证不可复制。no-store 和 cleanup 只减少缓存驻留，不能称为安全擦除或内容保护。离线课程应另定缓存授权、保留时间和撤权语义。
6. 播放器状态最多证明应用收到 loaded/playing/finished 等技术状态；不能证明扬声器有音量、耳机已佩戴、孩子听到、注意或理解。可记录“播放请求/播放器完成事件（若可用）”，不能将其作为学习证据、“已听”判定或掌握度；学科证据仍来自之后的作答，而且正确也只是题目级表现。

**可选后续：**

- 经真实录制验证后可增加 AAC-LC/M4A 以减小体积，但必须明确 codec/profile；扩展名 .m4a 不保证内含 codec。
- WAV 可用于制作/质检，但文件通常较大，且 Android 官方表列的 WAV 支持限定 linear PCM 样式。不能因现有 response attachment extension allowlist 含 WAV，就认定它适合作课程发布格式。
- WebM/Ogg/Opus 可作为未来平台优化；首版不把它们列入统一资产格式，除非目标设备覆盖已验证。Expo Audio 没有项目自带的跨平台 codec 保证清单。
- 托管转码、恶意文件扫描、对象存储/CDN、短期 signed URL 与 DRM 应由真实访问量、许可、合规或离线需求驱动，不作为第一个短音频练习的先决条件。

### 应补入验收清单的可证伪测试

- 构造合法 MP3 头部后接截断/随机 payload，确认头部检查可能通过但作者预览/播放失败时不可发布且不计为答题错误；声明 MIME 与头部不匹配则拒绝。
- 手动验证实际支持矩阵：iOS 真机或模拟器、Android 设备、Web Chrome 与 Safari（若均为支持目标）。验证上传后服务端取回的同一字节能完整播放；记录 OS/browser/build、MIME、asset ID 和播放完成/错误。此验证仍不证明孩子真的听到或理解。
- 未授权、成员移出、课程撤回、题目取消发布或素材下架后，受保护 GET 不返回内容。下载完成后撤权，现有临时文件可能仍可读；验证离题 cleanup，并明确此不可撤回边界。
- 网络中断、API 401/403/404/5xx、浏览器不支持 codec、原生解码失败、路由卸载/切题、迟到下载不得误校验或让旧音频串到新题。Web Blob URL/app cache cleanup 可重复安全执行。
- 真实 duration/播放结束事件只用于 UI。异常时长（NaN/Infinity/0）、仅加载未播放、系统媒体音量为零、媒体焦点中断都不能推断孩子“已听完”。

