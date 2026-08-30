# MemoPal agent instruction index

Project conventions are maintained centrally in this directory. The root
`AGENTS.md` points agents here before they edit app or backend code.

```text
principles.md              engineering principles for every change
app/README.md              shared frontend rules
app/mobile.md              Expo/mobile conventions
app/admin.md               Vite/admin conventions
backend/backend.md         .NET backend conventions
```

Read `principles.md` first, then the app or backend document for the code being
changed.

## Why the rules are not all skills

A skill is best for a reusable capability or workflow that can apply across
projects. A repository's folder names, API response types, auth adapters,
commands, and product boundaries are local conventions; they should be
maintained in these project documents instead of requiring a skill match.

The following project-specific guidance was moved into the files above:

- `memopal-admin-portal` -> `app/admin.md`
- `memopal-backend-clean-cqrs` -> `backend/backend.md`
- `react-native-app` -> `app/mobile.md`
- `frontend-architecture-maintainability` -> `app/README.md` and app-specific docs
- `dotnet-clean-cqrs-mediatr-delivery` -> `backend/backend.md`

The reusable `antd-pro-design` and `dotnet-clean-architecture` skills remain
available under `.github/skills` for cases where their general techniques are
useful.

## Updating the instructions

When a convention changes, update the relevant document here and the relevant
README/test in the same change. Keep examples tied to real paths and current
response types. If a rule is only a future product decision, put it in the
design plan and label it as future work rather than making it a current coding
requirement.
