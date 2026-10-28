# Mapster 7.4.0 配置生命周期与并发风险核查

研究日期：2026-10-27。本文是源码核查记录与待验证假设，不是对并行集成测试根因的定论。依据 Mapster `v7.4.0` tag 和当前仓库源码；若依赖升级，应重核上游实现。

## 摘要

- 仓库固定引用 `Mapster 7.4.0`。[MemoPal.Application.csproj](../../apps/api/src/MemoPal.Application/MemoPal.Application.csproj)
- 当前 `AddApplication` 每次调用都会设置两个 `MapsterRegistration` 静态属性，然后对进程级 `TypeAdapterConfig.GlobalSettings` 执行 `Scan(Assembly.GetExecutingAssembly())`；扫描会发现 `MapsterRegistration : IRegister`，其 `Register` 对多个类型调用 `NewConfig`。`Program.cs` 调用 `AddApplication`。[DependencyInjection.cs](../../apps/api/src/MemoPal.Application/DependencyInjection.cs)；[MapsterRegistration.cs](../../apps/api/src/MemoPal.Application/Common/Mapping/MapsterRegistration.cs)；[Program.cs](../../apps/api/src/MemoPal.Api/Program.cs)
- Mapster v7.4.0 源码提供并发字典缓存 mapping delegate，首次适配路径通过 `AddToHash` 缓存；这支持将“已稳定配置”的 mapper 在并发请求中使用的判断。但 `Scan`/`Apply` 本身依次执行 `IRegister.Register(config)`，而 `NewConfig` 会 remove 后创建 mapping。代码没有把“重扫同一全局配置”作为原子操作或文档化的线程安全启动方式。因此**运行中并发 Scan/配置修改与 Adapt 的安全性未获源码支持**。
- 更具体的日志已经观察到失败请求中，`AuthSessionManager.IssueAsync` 的 `.Adapt<UserWithStatDto>()` 导致 Mapster `CompileException`，目标映射为 `(User, UserStats) -> UserWithStatDto`，inner exception 为 `NullReferenceException`，栈定位到 `ReflectionUtils.Next` 对 `InvokerModel` 的投影。它与映射配置生成期间状态不一致的假设相容，但不能单凭栈确认是并发重扫，也不能排除映射表达式或对象配置自身的问题。
- 最低风险方向是保证配置在任何请求前只建立一次；如果多个 host 必须有不同配置，使用每个 host 独立的 `TypeAdapterConfig`，注入相应 mapper，并消除静态 URL 配置。`Compile()` 可在扫描后作为启动期映射验证/预热，不能代替隔离全局配置或锁住配置阶段。

## 仓库当前事实

以下为修复前的源码基线；本轮后续已实施一次性初始化，验证记录见文末。

修复前 `DependencyInjection.AddApplication` 的每次调用会：

1. 写入 `MapsterRegistration.BaseUrl` 和 `PublicBasePath` 静态属性。
2. 取得 `TypeAdapterConfig.GlobalSettings`。
3. 扫描 Application assembly。

Mapster `Scan` 查找并实例化 assembly 中所有非抽象 `IRegister` 类，再调用 `Apply(registers)`；`Apply` 顺序调用每个 `register.Register(this)`。本仓库注册类通过多次 `NewConfig<,>()` 定义映射。`AuthSessionManager.IssueAsync` 在认证响应构造时直接调用静态扩展 `.Adapt<UserWithStatDto>()`。所以并行建多个 API host 会在同一进程内重复触碰全局配置；是否同一时刻重叠取决于测试具体调度，不能只由代码静态推断。

## Mapster v7.4.0 上游源码核实

### 配置和注册行为

- `TypeAdapterConfig.GlobalSettings` 是 `static` 单例字段，源码初始化为 `new TypeAdapterConfig()`。[TypeAdapterConfig.cs（v7.4.0）](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterConfig.cs)
- `Scan(params Assembly[])` 用反射发现 `IRegister`，创建实例并调用 `Apply`；`Apply` 对枚举逐个调用 `Register(this)`，没有围住整个 scan/apply 的锁或事务边界。[Scan/Apply 源码](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterConfig.cs)
- `NewConfig<TSource,TDestination>()` 先 `Remove(...)`，再返回 `ForType(...)` 的 setter；Mapster 官方配置 wiki 也明确说 `NewConfig` 会丢弃既有该类型对配置，`ForType` 则会增强已有配置。[v7.4.0 源码](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterConfig.cs)；[官方 Configuration wiki](https://github.com/MapsterMapper/Mapster/wiki/Configuration)（wiki 修订时间显示 2020-08-13；按版本行为以 v7.4.0 源码为准。）
- `RuleMap` 和映射 delegate cache 使用 `ConcurrentDictionary`，`Rules` 则是 `List<TypeAdapterRule>`，在若干内部添加/合并路径上有 `lock (Rules)` / `LockAdd`。这说明特定缓存和部分规则访问采用并发保护，不足以推出整个可变配置对象可被多线程并发重配。
- 注册 setter 在相应 mapping 已编译后会检查 `Settings.Compiled` 并抛出 “TypeAdapter.Adapt was already called, please clone or create new TypeAdapterConfig.” 这明确要求同一映射第一次被使用后，不要再修改该映射配置。[TypeAdapterSetter.cs（v7.4.0）](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterSetter.cs)

### 并发 Adapt 与配置并发的区分

- v7.4.0 的 `GetMapFunction` 先查 `_mapDict`，未命中时以 `AddToHash` 生成并缓存 delegate；该缓存及 `_mapToTargetDict`、projection cache 均为 `ConcurrentDictionary`。[TypeAdapterConfig.cs（v7.4.0）](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterConfig.cs)
- 因而，可将同一已建好且未再变动的配置在并发请求中调用作为合理工作方式；源码缓存是并发容器，支持这种使用方式的推断。但它不是对“同时运行 `Scan`/`NewConfig`/setter 与首次 `.Adapt()`”的保证。缓存容器本身线程安全，不能使注册列表、`IRegister` 设置变更、缓存失效和表达式编译成为一个不可分割事务。
- 官方 DI wiki 推荐启动时构造/取得一个 `TypeAdapterConfig`，把它注册为 Singleton，并注册 `ServiceMapper` 为 Scoped；示例允许使用新的配置，也给出使用 `GlobalSettings` 的选项。[官方 Dependency Injection wiki](https://github.com/MapsterMapper/Mapster/wiki/Dependency-Injection)（wiki 编辑记录 2020-06-05；该示例依赖 `Mapster.DependencyInjection` 插件。）

### Compile 生命周期

- `TypeAdapterConfig.Compile(bool failFast = true)` 遍历已登记的 `RuleMap.Keys`，生成 mapping 与 map-to-target delegate；默认首个异常立即抛出。它应在所有 mapping 注册完成后调用，可将更多映射构建问题提早暴露/预热。[Compile 实现与文档注释](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterConfig.cs)
- 逐类型 `Compile(sourceType, destinationType)` 也能校验/缓存单一映射；`CompileProjection` 用于 queryable projection，是不同路径。
- 源码显示常规首次 `Adapt` 会延迟生成映射；未发现“必须调用全局 Compile 才可并发 Adapt”的保证。Compile 不能解决两个 host 重复写全局配置，必须先解决配置唯一所有者、时序和隔离。

## 失败证据与假设边界

协调任务提供的 `run03` 日志记录：全量并行集成测试首批 register 请求多个 HTTP 500；失败映射为 `(User, UserStats) -> UserWithStatDto`，栈落在 `AuthSessionManager.IssueAsync.Adapt`；内部错误为 Mapster `CompileException`，其中 NullReference 指向 `Mapster.ReflectionUtils.<Next>b__0(InvokerModel it)`。失败日志位于本机 `%TEMP%/memopal-classroom-parallel-diagnostic-03.log`（不是仓库文件）。这是目前可核实到的实际失败证据，区别于下文基于源码的机制推测。

v7.4.0 的 `ReflectionUtils.Next` 会对 resolver 集合执行 `Select(it => it.Next(source, destName))`；`InvokerModel.Next` 会读取 `DestinationMemberName.StartsWith(...)`，并在后续根据 `SourceMemberName` 或 `Invoker` 构造表达式。[ReflectionUtils.cs](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/Utils/ReflectionUtils.cs)；[InvokerModel.cs](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/Models/InvokerModel.cs)。日志报告的是 lambda 帧而非具体字段值，因此不能精确断言哪个 `InvokerModel` 成员为空。

**待证假设：** 多个 host 同时重扫并修改 `GlobalSettings`，而另一个 host 的注册请求首次编译该 tuple mapping，可能造成 Resolver/settings 不完整或编译看到配置切换状态，从而引发此栈。源码确认存在共享可变全局对象、重复注册和并发 cache，但没有证明 `run03` 两种操作发生了精确时序重叠，也没排除具体 `.Map(...)` 表达式、数据/模型差异或 Mapster 缺陷。应将其视为优先验证方向，而不是根因结论。

额外的 host 间共享状态：映射表达式调用 `ToAbsoluteMediaUrlOrNull` 等辅助方法，而这些方法读取 `MapsterRegistration.BaseUrl` 与 `PublicBasePath` 静态可变字段。若多个测试 host 的设置不同，即使只在启动期扫描，也可能使所有 host 的后续映射受“最后一次写入”的影响。这是独立于 NRE 的配置隔离风险。[MapsterRegistration.cs](../../apps/api/src/MemoPal.Application/Common/Mapping/MapsterRegistration.cs)

## 最小修复选项与权衡（研究时的建议）

### A. 配置对所有 host 完全相同：一次性全局配置

- 在进程级 composition root 中对 `GlobalSettings` 只执行一次注册；用明确的静态初始化/一次性 guard，且保证所有 host 接收相同的 `BaseUrl`、`PublicBasePath`。所有 `.Adapt` 调用须发生在初始化完成后。
- `Compile()` 放在 scan 之后，可在启动期发现映射配置异常并预热；启动失败时保留具体 inner exception。
- 这是改动量最小的生产运行时方案，但测试若构造多个具有不同配置的 host，会共享第一份/最后写入的全局状态，不具隔离性。简单 `lock` 只能串行扫描，不能让一个全局映射对多个不同 host 变成各自配置。

### B. host 配置可不同：每 host 一个配置实例

- 每个 host 启动时创建 `new TypeAdapterConfig()`，对该实例 `Scan`，完成后 `Compile()`，再将配置以 singleton 注册于该 host 容器，并通过 `ServiceMapper`/`IMapper` 传递该实例使用。
- 去掉 `TypeAdapterConfig.GlobalSettings` 的隐式静态适配；改为显式注入 mapper，或在支持的方法中传配置参数，避免不同 host 回落到静态 global。若配置同时需要媒体 URL，改成每个 config 捕获不可变 host 参数或注入独立服务，取消 `MapsterRegistration` 的静态可变 URL。
- 特别要检查嵌套映射：当前 `MapsterRegistration` 的 `Stats` 映射表达式内部还有 `(src.Stats).Adapt<UserStatsDto>()` 静态调用。改为每 host 配置时，必须确保该嵌套 Adapt 也绑定 host 的 config，或改用让 Mapster 基于目标成员自动应用同一 config 的映射表达式；否则表面上注册了独立 config，内层仍可能读 `GlobalSettings`。
- Mapster 官方 DI wiki 给出了每个服务容器单例 config 的注册形态；当前项目引用的是 Mapster 包而非已确认的 `Mapster.DependencyInjection`，如果采用该插件需先核查并增加依赖，否则可使用明确的实例配置路径自行封装。
- 优点是 host/test 隔离清晰；成本是将当前分布式静态 `.Adapt<T>()` 调用改为显式 config/mapper 使用，并验证每个 handler/service 的注入路径。

## 推荐排查顺序

1. 固定复现时把所有 host 的 `AddApplication`、`Scan` 起止和首次目标 `.Adapt` 记录为仅测试诊断时间线；不得打印业务对象内容。确认失败 host 的 base URL/path 是否不同。
2. 单独对同一 `TypeAdapterConfig` 在单线程先 `Scan` 一次、再 `Compile()`，执行目标 tuple 的映射；与双 host 并发构建对照。该实验可区分静态映射本身不合法与启动期并发修改风险。
3. 让多 host 使用各自显式 config，并在所有 host 初始化完成后并发打 register。若故障消失，仍需复核是否由改动同时改变了初始化顺序，不能只据此宣称唯一因果。
4. 保留完整 inner stack 和失败映射键；不要为了让测试通过而吞掉 `CompileException` 或跳过 register 测试。

## 一手来源

实施结果：本轮采用 A，以进程锁保护一次性媒体配置、Scan 和 Compile，新增并行初始化/映射单元测试。首个 host 的媒体配置为进程共享值，未引入每 host mapper 隔离。完整重建并核对集成输出 DLL 后，三次冷启动并行运行各为 107 通过、3 PostgreSQL 专项跳过、0 失败；详见 [计划中的实际验证记录](product-redesign-plan.md)。这支持本轮风险修复，不证明所有历史缺失日志失败的唯一根因。

- Mapster NuGet 7.4.0：[包版本/目标框架](https://www.nuget.org/packages/Mapster/7.4.0)
- Mapster `v7.4.0` 源码：[TypeAdapterConfig.cs](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterConfig.cs)、[TypeAdapterSetter.cs](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/TypeAdapterSetter.cs)、[ReflectionUtils.cs](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/Utils/ReflectionUtils.cs)、[InvokerModel.cs](https://github.com/MapsterMapper/Mapster/blob/v7.4.0/src/Mapster/Models/InvokerModel.cs)
- Mapster 官方 wiki：[Configuration](https://github.com/MapsterMapper/Mapster/wiki/Configuration)、[Dependency Injection](https://github.com/MapsterMapper/Mapster/wiki/Dependency-Injection)

