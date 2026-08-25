# MemoPal

MemoPal is a playful memory-training application built around two techniques:
Memory Palace and Number Peg. This repository is the single source of truth for
the mobile app, administration portal, API, deployment configuration, product
documentation, and contributor guidance.

## Repository layout

```text
apps/
  mobile/       Expo / React Native application
  admin/        React administration portal
  api/          ASP.NET Core API and tests
.github/
  skills/       Reusable technology/workflow skills
  workflows/    CI and deployment automation
AGENTS.md       Repository-wide coding-agent instructions
deploy/         Shared Docker Compose and nginx configuration
docs/           Product and architecture documentation
palaceData/     Palace authoring source imagery (Git LFS)
```

## Development

Install JavaScript dependencies once from the repository root:

```bash
npm install
```

Common commands:

```bash
npm run dev:mobile
npm run android
npm run check:mobile
npm run dev:admin
npm run check:admin
dotnet test MemoPal.slnx
```

`npm run android` builds and installs the Android development client locally
with Expo and the local Android SDK. It does not use EAS or a cloud build. The
local build uses the debug signing certificate, so register that SHA-1 with
Google OAuth when testing native Google Sign-In locally. EAS development and
preview builds remain available separately through the profiles in
`apps/mobile/eas.json`.

Copy each checked-in `.env.example` to its local `.env` file as needed. Real
credentials, runtime uploads, build output, and local databases must never be
committed.

Coding-agent conventions are centralized under
[`docs/agent-instructions/`](docs/agent-instructions/README.md). Start with
[`AGENTS.md`](AGENTS.md), then read the relevant document before editing
mobile, admin, or API code. The instruction index is available at
[`docs/agent-instructions/README.md`](docs/agent-instructions/README.md).

The API applies pending EF Core migrations at startup by default. Set
`Database__ApplyMigrationsOnStartup=false` when migrations are owned by a
deployment job instead.
