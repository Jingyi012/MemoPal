# Quality Gates

Run from `MemoPal.backend/`.

## Mandatory checks

1. Build solution:
```powershell
dotnet build MemoPal.sln
```

2. Run unit tests:
```powershell
dotnet test tests/MemoPal.UnitTests/MemoPal.UnitTests.csproj
```

3. Run integration tests (if endpoint or persistence behavior changed):
```powershell
dotnet test tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj
```

## Migration checks (when schema changes)

1. Create migration:
```powershell
dotnet ef migrations add <DescriptiveName> --project src/MemoPal.Infrastructure --startup-project src/MemoPal.Api
```

2. Apply/update local database if required by team workflow:
```powershell
dotnet ef database update --project src/MemoPal.Infrastructure --startup-project src/MemoPal.Api
```

3. Rebuild after migration:
```powershell
dotnet build MemoPal.sln
```

## Architecture checks before merge

- No controller-level business logic.
- Handler returns consistent wrapper types.
- Domain layer remains infrastructure-free.
- Infrastructure changes stay behind application abstractions where appropriate.
- Added tests cover changed behavior and a failure path.
