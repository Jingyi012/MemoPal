# MemoPal deployment

MemoPal keeps uploaded media on the filesystem and stores the media metadata
and relative path in PostgreSQL. The deployment compose file uses host-folder
bind mounts so database data and uploads survive container replacement.

## Persistent folders

Copy `.env.example` to `.env` on the server and set the two absolute host
paths for that environment:

```text
POSTGRES_DATA_PATH=/opt/memopal/postgresql/data
host:      /opt/memopal/postgresql/data
container: /var/lib/postgresql/data

MEMOPAL_UPLOADS_PATH=/srv/memopal/uploads
host:      /srv/memopal/uploads
container: /data/uploads
```

The Docker service account must be able to read and write both folders. Back
up the PostgreSQL folder and the uploads folder together. Changing either path
does not migrate existing data; copy the existing folder (or use `pg_dump` and
`pg_restore` for PostgreSQL) before switching paths.

## Server setup

1. Install Docker Engine and the Docker Compose plugin.
2. Copy `deploy/.env.example` to `${DEPLOY_PATH}/.env` and set the private
   values, including `IMAGE_OWNER`, database credentials, absolute storage
   paths, JWT settings, and public URLs.
3. Create the configured folders and grant the Docker service account access.
4. Ensure the VPS can pull the GHCR images (authenticate to GHCR first when
   the packages are private).

The GitHub Actions workflows upload the compose manifest and pull/restart the
API and admin images. They deliberately do not overwrite the server's private
`.env` file.

## GitHub Actions setup

Create a GitHub Environment named `uat` (and `prod` if needed) with:

- `DEPLOY_PATH`: absolute deployment directory on the VPS, for example
  `/opt/memopal` (an environment variable is recommended; a secret with the
  same name is also accepted).
- `IMAGE_OWNER` (optional): GHCR user or organization; defaults to the
  repository owner. It can be stored as either an environment variable or a
  secret.
- `MEMOPAL_MOBILE_API_BASE_URL` and `MEMOPAL_MOBILE_MEDIA_BASE_URL` for the
  admin workflow (environment variables are recommended; environment secrets
  are also supported). The legacy names `VITE_API_BASE_URL` and
  `VITE_MEDIA_BASE_URL` are accepted as fallbacks.

Configure environment secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, and the
optional `VPS_PORT` (defaults to `22`). The deployment user must be allowed to
run Docker Compose.

## Database migrations

`Database__ApplyMigrationsOnStartup=true` is enabled in the example so a new
deployment can bring the schema up to the latest migration automatically. Set
it to `false` when migrations are managed separately, then enable it for an
intentional migration release.

## Ports

The example binds PostgreSQL to `DB_BIND_HOST:DB_HOST_PORT`, the API to
`API_BIND_HOST:API_HOST_PORT`, and the admin site to
`ADMIN_BIND_HOST:ADMIN_HOST_PORT`. Restrict PostgreSQL with a firewall or use
`DB_BIND_HOST=127.0.0.1` with an SSH tunnel when external database access is
not required.
