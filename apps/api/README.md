# MemoPal API

The API is the ASP.NET Core service in the MemoPal monorepo. It owns the
technique-neutral memory-set model, practice attempts, review scheduling, auth,
and administration APIs.

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

## Database migrations

The API automatically applies all pending EF Core migrations when it starts.
This is enabled by default through `Database:ApplyMigrationsOnStartup` and is
equivalent to running `dotnet ef database update` before serving requests. If
migrations are managed by a separate deployment job, set
`Database__ApplyMigrationsOnStartup=false`.

Create a new migration when the model changes:
```bash
dotnet ef migrations add DescribeTheChange \
  --project apps/api/src/MemoPal.Infrastructure \
  --startup-project apps/api/src/MemoPal.Api \
  --output-dir Persistence/Migrations
```

## Tests
```bash
dotnet test MemoPal.sln
```
