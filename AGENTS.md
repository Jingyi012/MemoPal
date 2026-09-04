# MemoPal agent instructions

These instructions apply to the whole repository. App and backend conventions
are maintained centrally under
[`docs/agent-instructions/`](docs/agent-instructions/README.md); read the
relevant document before editing that area.

The core engineering principles are in
[`docs/agent-instructions/principles.md`](docs/agent-instructions/principles.md)
and apply to every change.

## Repository map

- `apps/mobile` - Expo Router React Native client. See the
  [mobile instructions](docs/agent-instructions/app/mobile.md).
- `apps/admin` - Vite React TypeScript administration portal. See the
  [admin instructions](docs/agent-instructions/app/admin.md).
- `apps/api` - ASP.NET Core API and .NET test projects. See the
  [backend instructions](docs/agent-instructions/backend/backend.md).
- `deploy` - Docker Compose and Nginx deployment configuration.
- `docs` - product/design documents and diagrams.

The solution and package workspace are rooted here. Run commands from the
repository root unless a command explicitly requires a project directory.

## Instruction and documentation precedence

Use this order when guidance disagrees:

1. This `AGENTS.md` file.
2. The relevant document under `docs/agent-instructions/`.
3. The current implementation and its tests.
4. The relevant app README or API reference.
5. `docs/application-design-plan.md`, which describes intended product
   direction and may be ahead of the implementation.

Do not treat generated output, local runtime data, mock JSON, or old reference
notes as architecture contracts. In particular, `apps/api/QUICK_REFERENCE.md`
is retained as historical context; use the backend instructions for current API
conventions.

## General working rules

Follow the [core engineering principles](docs/agent-instructions/principles.md)
when choosing between multiple valid implementations.

- Inspect the existing feature, route, endpoint, and test before adding a new
  pattern. Extend an established pattern when one exists.
- Keep changes scoped to the requested feature. Do not perform broad
  migrations or rename unrelated files as part of ordinary feature work.
- Keep API contracts typed end to end. Update the backend contract, the
  relevant client types/API module, and tests together when a response changes.
- Do not put secrets, tokens, private user content, raw answers, Palace photos,
  or association text in logs, analytics, or committed configuration.
- Never commit `.env` files, credentials, generated build output, uploads, or
  local database/runtime data. Use the checked-in `.env.example` files.
- Preserve UTC timestamps and server authority for ownership, authorization,
  progress, subscriptions, and review scheduling.
- Prefer small, reviewable files and feature-local code over growing shared
  utilities. Move code to a shared location only after it has a real reuse
  case.

## Validation

Run the smallest relevant checks while iterating and the broader checks before
handoff:

```powershell
npm run check
dotnet build MemoPal.slnx
dotnet test apps/api/tests/MemoPal.UnitTests/MemoPal.UnitTests.csproj
```

For API endpoint or persistence changes, also run:

```powershell
dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj
```

Report checks that could not be run, especially device-only iOS/Android
checks.

## Guidance catalog

The project-specific skills that previously duplicated these rules have been
moved into the documentation files. The remaining `.github/skills`
entries are reusable techniques and should be selected only when their
technology/workflow is actually relevant:

- `antd-pro-design` - reusable Ant Design Pro CRUD/layout guidance.
- `dotnet-clean-architecture` - reusable Clean Architecture background.

The instruction index is at
[`docs/agent-instructions/README.md`](docs/agent-instructions/README.md).
