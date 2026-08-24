# MemoPal

MemoPal is a playful memory-training application built around two techniques:
Memory Palace and Number Peg. This repository is the single source of truth for
the mobile app, administration portal, API, deployment configuration, product
documentation, and contributor skills.

## Repository layout

```text
apps/
  mobile/       Expo / React Native application
  admin/        React administration portal
  api/          ASP.NET Core API and tests
.github/
  skills/       Repository-specific Codex skills
  workflows/    CI and deployment automation
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
npm run check:mobile
npm run dev:admin
npm run check:admin
dotnet test MemoPal.slnx
```

Copy each checked-in `.env.example` to its local `.env` file as needed. Real
credentials, runtime uploads, build output, and local databases must never be
committed.

The API applies pending EF Core migrations at startup by default. Set
`Database__ApplyMigrationsOnStartup=false` when migrations are owned by a
deployment job instead.
