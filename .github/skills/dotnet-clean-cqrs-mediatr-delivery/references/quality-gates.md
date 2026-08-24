# Quality Gates

Run from the monorepo root.

## Mandatory checks

1. Build solution:
```powershell
dotnet build MemoPal.slnx
```

2. Run unit tests:
```powershell
dotnet test apps/api/tests/MemoPal.UnitTests/MemoPal.UnitTests.csproj
```

3. Run integration tests (if endpoint or persistence behavior changed):
```powershell
dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj
```

## Migration checks (when schema changes)

1. Create migration:
```powershell
dotnet ef migrations add <DescriptiveName> --project apps/api/src/MemoPal.Infrastructure --startup-project apps/api/src/MemoPal.Api
```

2. Apply/update local database if required by team workflow:
```powershell
dotnet ef database update --project apps/api/src/MemoPal.Infrastructure --startup-project apps/api/src/MemoPal.Api
```

3. Rebuild after migration:
```powershell
dotnet build MemoPal.slnx
```

## Architecture checks before merge

- No controller-level business logic.
- Handler returns consistent wrapper types.
- Domain layer remains infrastructure-free.
- Infrastructure changes stay behind application abstractions where appropriate.
- Added tests cover changed behavior and a failure path.
