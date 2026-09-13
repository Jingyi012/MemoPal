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

Configure text generation in Admin → System Settings → AI → Text generation.
The database setting `ai.text` stores `provider`, `model`, `endpoint`, `apiKey`,
`batchSize`, `maxConcurrentRequests`, and `timeoutSeconds`. Changes apply to new
requests without restarting. Do not put credentials in the mobile app or repository.
No external model is selected by default; missing configuration uses free templates.

OpenRouter also uses Admin's `maxOutputTokens` (default 2048 per batch) and
`reasoningEnabled` (default false). Short mnemonic requests should leave extended
reasoning off. Otherwise a reasoning model can return HTTP 200 headers and keep
sending whitespace while it thinks, exceeding the request deadline before the
final JSON arrives. These defaults also apply to existing rows missing the fields.

Supported text providers are `gemini`, `ollama`, and `openrouter`. Enter the
selected provider's model ID and endpoint explicitly. Gemini uses its API base
URL; Ollama uses the full `/api/chat` URL; OpenRouter uses
`https://openrouter.ai/api/v1/chat/completions`. Only local Ollama permits an
empty key and HTTP. Legacy provider-specific database fields remain readable,
but new Admin saves use generic fields. Environment settings under the old
`AI:PalaceAssociations` section are not used; configure the database through Admin.

The API sends one request per internal batch (12 items by default), so a list
of 100 items does not create 100 user-facing requests. Failed or unavailable
provider calls fall back to starter text for the affected batch.

Number Peg story generation reuses the same `ai.text` provider,
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
