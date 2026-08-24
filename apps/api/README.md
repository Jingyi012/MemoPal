# MemoPal.backend (.NET 10 Clean Architecture MVP)

## Stack
- .NET 10
- C#
- Clean Architecture (`Api`, `Application`, `Domain`, `Infrastructure`)
- PostgreSQL via Npgsql + EF Core

## Endpoints
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer JWT)
- `PATCH /auth/profile` (Bearer JWT)

## Contract notes
- Auth responses return `jwtToken` and `user`.
- `user` fields: `id`, `email`, `displayName`.

## Configuration
Set configuration via `appsettings.*.json` and/or environment variables.

Required for non-test runtime:
- `ConnectionStrings__DefaultConnection`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Jwt__Secret` (required, min length 32)
- `Jwt__ExpiryMinutes`

## Run
```bash
dotnet restore
dotnet build MemoPal.sln
dotnet run --project src/MemoPal.Api
```

## Migrations (PostgreSQL)
```bash
dotnet tool install --global dotnet-ef

dotnet ef migrations add InitialAuth \
  --project src/MemoPal.Infrastructure \
  --startup-project src/MemoPal.Api \
  --output-dir Persistence/Migrations

dotnet ef database update \
  --project src/MemoPal.Infrastructure \
  --startup-project src/MemoPal.Api
```

## Tests
```bash
dotnet test MemoPal.sln
```
