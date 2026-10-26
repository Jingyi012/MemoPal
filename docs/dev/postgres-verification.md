# PostgreSQL migration verification

This opt-in integration test creates a uniquely named temporary database, applies every EF migration, rolls back to the migration immediately before Education Slice 0, reapplies the full chain, checks the Slice 0 and classroom-course schema, then drops only the generated database in a `finally` block.

## Prerequisites

- A local PostgreSQL instance or Docker PostgreSQL container reachable from the test host.
- A connection string in `MEMOPAL_CREDIT_TEST_CONNECTION`. The database name in this connection string is used only as the server/maintenance connection; the test overrides it with a generated database name.
- The PostgreSQL role must be able to connect to the maintenance database and `CREATE DATABASE`, and must be able to `DROP DATABASE` for the generated database (including `DROP DATABASE ... WITH (FORCE)`). Do not point this variable at production.
- Do not put the connection string in source files, command arguments, logs, or committed configuration. The test checks presence but does not print its value.

## Docker example

Start a local PostgreSQL container with a throwaway development password and a role that can create databases. Keep the password in your local shell/session or secret manager, not in this repository. For example, map a local port to the container and connect to the maintenance database (`postgres`).

PowerShell environment setup (replace the value locally; do not paste it into tracked files):

```powershell
$env:MEMOPAL_CREDIT_TEST_CONNECTION = '<local PostgreSQL connection string to postgres>'
dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj --filter FullyQualifiedName~PostgresEducationSlice0Tests
```

For a local Windows PostgreSQL service, use the same environment variable with a role that has `CREATEDB` and can drop databases it creates. The test does not need access to any application database.

## Cleanup

The test drops its generated database even when migration or assertions fail. If the test process is forcibly terminated, list databases using your local PostgreSQL administration tool and remove only databases named `memopal_education_test_<32 hex characters>` after confirming they were created by this test. Never use a broad wildcard cleanup and never delete the maintenance database.

When the variable is absent, xUnit marks the test skipped with a reason that names the variable and required permissions. The ordinary InMemory integration suite does not establish PostgreSQL migration compatibility.
