# Education Memory Bridge test execution

For derivation concurrency and other API checks, serialize **all builds and test execution**:

1. Stop the current command before starting another command that can compile or write to the same `obj`/`bin` tree.
2. Build once into an isolated output directory when a developer/API process holds repository DLLs. Example:

   ```powershell
   dotnet build MemoPal.slnx --no-restore -p:BaseOutputPath=C:\Temp\MemoPal-education\build\
   ```

3. After the build has completed, run tests with `--no-build --no-restore` and the same `BaseOutputPath`. Serial API tests:

   ```powershell
   dotnet test apps/api/tests/MemoPal.UnitTests/MemoPal.UnitTests.csproj --no-build --no-restore -p:BaseOutputPath=C:\Temp\MemoPal-education\build\
   dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj --no-build --no-restore -p:BaseOutputPath=C:\Temp\MemoPal-education\build\
   ```

4. If checking API test projects concurrently, launch both only after step 2 has completed. Do not allow either test command to build. Give parallel integration execution at least five minutes before treating it as timed out.

`CustomWebApplicationFactory` assigns each test host a random InMemory database name and a private `InMemoryDatabaseRoot`. InMemory does not enforce relational unique indexes or emulate PostgreSQL transaction-abort behavior. The HTTP concurrency test verifies single-process duplicate requests; the gated PostgreSQL test uses independent contexts/lock instances to exercise the database uniqueness and recovery path. PostgreSQL checks run only when `MEMOPAL_CREDIT_TEST_CONNECTION` is present; never print or commit its value.

## Restricted Learner checks

Use the same completed build for the two API projects. To disable test-collection parallelism for the serial run, append `-- xUnit.ParallelizeTestCollections=false xUnit.MaxParallelThreads=1`. Then, after both serial commands finish, run the two projects concurrently with `--no-build --no-restore` and default collection parallelism. Allow at least five minutes; do not interpret silence as a hang or start a new build while either test process is alive. `npm run check` is run after these commands complete.

When EF needs current assemblies but the normal Debug API is held by a running developer process, an API-project-only custom configuration is available:

```powershell
dotnet build apps/api/src/MemoPal.Api/MemoPal.Api.csproj -c RestrictedLearner --no-restore
dotnet ef migrations has-pending-model-changes --project apps/api/src/MemoPal.Infrastructure --startup-project apps/api/src/MemoPal.Api --configuration RestrictedLearner --no-build
```

Do not build the solution with `-c RestrictedLearner`: the solution declares only its normal configurations. This API build and EF command must also run after all test processes have ended. It does not apply migrations. The RestrictedLearner tests add no credentials or real provider calls; the background-image case reuses the existing fake HTTP provider.
