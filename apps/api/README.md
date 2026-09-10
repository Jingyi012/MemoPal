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

Palace association generation is usable without an external service: the
default `AI:PalaceAssociations:Provider=template` setting creates deterministic
starter text. For richer scenes, configure one provider on the API (never in
the mobile app):

```text
AI__PalaceAssociations__Provider=gemini
AI__PalaceAssociations__GeminiApiKey=<secret>
AI__PalaceAssociations__GeminiModel=gemini-3.5-flash-lite
```

For local development, keep the key out of the repository by using .NET user
secrets:

```bash
dotnet user-secrets set "AI:PalaceAssociations:Provider" "gemini" --project apps/api/src/MemoPal.Api
dotnet user-secrets set "AI:PalaceAssociations:GeminiApiKey" "<secret>" --project apps/api/src/MemoPal.Api
```

For a local model, use `Provider=ollama` with
`AI__PalaceAssociations__OllamaEndpoint` and `AI__PalaceAssociations__OllamaModel`.
The API sends one request per internal batch (12 items by default), so a list
of 100 items does not create 100 user-facing requests. Failed or unavailable
provider calls fall back to starter text for the affected batch.

Number Peg story generation reuses the same `AI:PalaceAssociations` provider,
model, endpoint, timeout, and secret configuration. The mobile app sends the
validated peg keyword snapshot; the API never infers an anchor from a number.

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
