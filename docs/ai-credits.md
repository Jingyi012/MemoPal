# AI credits and Number Peg illustrations

## Delivery status

Implemented: server-owned balances and an additive credit ledger, expiring grant
batches, atomic reservations, settlement by successful AI item, request replay,
stale reservation recovery, rate/concurrency limits, both existing text generation
flows, private Number Peg image jobs, mobile wallet/history and image adoption,
and admin wallet/history/manual grants.

**Billing is not connected.** Monthly subscription grants, à la carte purchases,
store receipt verification, renewal/refund handling, product prices and monthly
allowances still require a payment platform and product configuration. Neither
the existing client `billing/subscribe` endpoint nor the administrative
subscription simulation grants credits. `IsPremium` and referral rewards do not
mint credits. The wallet returns `purchasesEnabled: false`; there is no simulated
checkout that can grant paid credits.

These changes do not apply a migration to the developer's current database or
enable a paid AI provider automatically.

## Configuration

Open **Admin → System Settings → AI Configuration**. Three private JSON rows in
the existing SystemSettings table are the source of truth:

| Database key | Fields |
| --- | --- |
| `ai.text` | `provider` (template/gemini/ollama), `model`, `endpoint`, `apiKey`, `batchSize`, `maxConcurrentRequests`, `timeoutSeconds` |
| `ai.images` | `provider` (gemini), `model`, `endpoint`, `apiKey` |
| `ai.credits` | `textCost`, `imageCost`, `imagesEnabled` |

Text configuration is shared by Number Peg and Palace sentences. Images have
independent credentials, model, and endpoint. An image model and key must be
configured and the credit enable switch turned on before image generation is
available. Both costs must be between 1 and 10,000.

Saving applies to the next request or image worker scope without restarting.
Each scope snapshots the database settings so that its metering and provider
decisions stay consistent. Already running work keeps its snapshot.

AI configuration no longer binds from appsettings or AI environment variables.
For existing installations, copy your configured models, endpoints and credentials
into Admin before enabling AI. No secrets are automatically copied or seeded.
Absent rows use safe defaults: template text, images disabled, text cost 1 and
image cost 10. These are development metering units, not retail prices.

Admin settings endpoints require the Admin role. Keys with the `ai.` prefix
are excluded from the mobile settings feed. Provider credentials are stored in the
database settings values; restrict database/backups access accordingly. They are
never returned in wallet responses or logged. No schema migration is needed for
these configuration rows.

The image transport requests a square image, validates file signatures and caps
stored images at 5 MB (provider responses at 10 MB). Billing remains a separate
integration; configuring AI does not enable checkout or grant subscription credits.

For Gemini image generation, `gemini-3.1-flash-lite-image` is a supported model
and is the Admin form's default. The request uses Gemini's `generateContent`
endpoint with `responseModalities` and the Gemini 3 `responseFormat.image`
configuration (the REST enum values `ASPECT_RATIO_ONE_BY_ONE` and
`IMAGE_SIZE_ONE_K`). The endpoint may be set to the provider's
supported `/v1` or `/v1beta` base URL. Other Gemini image models use the legacy
`imageConfig` shape where required by that model.

## Credit rules and reliability

- Grants have a globally unique reference, source, original amount, remaining
  amount and optional UTC expiration. `subscription`, `purchase`, and `manual`
  are distinct ledger sources. Only manual grants currently have an API entry point.
- Expiring grants are consumed before non-expiring grants. Expired amounts cannot
  be spent. A reservation keeps its batch allocation until settlement.
- A generation reserves its maximum cost before calling the provider. Partial
  text results charge only items explicitly marked as AI; templates cost zero.
  Missing Gemini credentials or a template-only provider advertises zero text cost.
  Mobile sends the confirmed `maxCredits`; a price increase beyond it is rejected
  before reservation or provider invocation.
- Ledger amounts are additive: grant, negative reservation, release of the full
  hold, negative actual charge, and negative expiration. Releasing the accounting
  hold does not grant the user new credits.
- A request ID is scoped to the authenticated user and fingerprinted against its
  input. Completed retries return the saved result; changed input conflicts.
  An in-progress request conflicts without another provider call. Failed requests
  need a new request ID. Mobile preserves the ID after an uncertain transport failure.
- PostgreSQL transaction-scoped advisory locks serialize writes for a user across
  API instances. No database transaction stays open during a provider request.
  In-memory tests use bounded semaphore stripes. Unique/check constraints provide
  additional database protection.
- Limit each user to three active generations and twenty new requests per minute.
  Exact replays do not consume another request slot.
- Text work finishes independently of a disconnected HTTP request, with a ten
  minute overall timeout. Results remain recoverable in the wallet. Reservations
  abandoned for fifteen minutes are released by the worker or the next generation
  command. Wallet/history queries do not mutate data.
- Image jobs are durable before the request returns. A worker claims a job once,
  gives the provider three minutes, then atomically stores the image and charge.
  A crashed processing job expires after five minutes; it is refunded rather than
  automatically calling a potentially already-billed provider again.

## API and user flows

- Existing text endpoints now require `requestId`; suggestions include a per-item
  `source` (`ai` or `template`). Batch sizes remain 1–100.
- `GET /v1/ai-credits`: balance, expiration and effective generation costs.
- `GET /v1/ai-credits/history?skip=0`: newest-first ledger, 50 entries per page.
- `GET /v1/ai-credits/generations`: latest 50 jobs and saved results.
- `POST /v1/ai-credits/number-peg-images`: `{ requestId, input: { pegNumber,
  pegKeyword, word, story } }` starts a job and reserves one image cost.
- `GET /v1/ai-credits/images/{id}`: private image bytes. The `/data` suffix returns
  a data URI using the same authenticated application HTTP client, including its
  normal token-refresh flow. Both responses are private/no-store.
- Admin-only `/v1/ai-credits/users/{userId}` and `/history` read a wallet;
  `/grants` accepts `{ reference, amount, expiresAt }` for an audited manual grant.

The mobile wallet is available from Premium and both association editors. Entering
Number Peg starts with free local associations. AI generation requires an explicit
action and a cost confirmation. Successfully generated results are charged even
when not adopted; the confirmation explains this. Manual editing and existing
content remain free.

Number Peg images can be previewed, adopted, removed, and regenerated. Drafts retain
the job ID and adopted image path. Changing the story warns that the image may no
longer match. Adopted images are displayed during rehearsal, not during recall.
Image bytes and wallet results are excluded from persisted mobile query caches.

Images currently stay in PostgreSQL and can only be read by their owner. Saving
a memory validates ownership of its generated image. Public sharing of memories
with these private illustrations is explicitly rejected; remove the illustration
before sharing. Public asset sharing, orphan-image retention/cleanup and moving
images to object storage are follow-up work; no automatic deletion is configured.

## Validation

Run the standard repository checks. Use Release if Visual Studio/the running API
locks the Debug binaries:

```powershell
npm run check
dotnet build MemoPal.slnx -c Release
dotnet test apps/api/tests/MemoPal.UnitTests/MemoPal.UnitTests.csproj -c Release
dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj -c Release
```

`PostgresAiCreditTests` also tests the full migration chain and independent
connections against PostgreSQL. Set `MEMOPAL_CREDIT_TEST_CONNECTION` privately to
a server account that can create databases. The test creates a uniquely named
`memopal_credit_test_*` database and removes only that generated database in a
`finally` block. Without that setting, this specific test is skipped.

Provider and image endpoint tests use deterministic fake responses. Live provider
quality/cost checks, store sandbox purchases and iOS/Android device checks still
need the configured services/devices.

Text and illustration generation are separate user actions and API calls. Generate
or manually edit the story first, then request an illustration using that final
story. Generating a story never automatically requests or charges for an image.
Both paths use the same reservation and settlement service with separate costs.

Text settings use provider-neutral field names. Gemini expects its base API URL;
Ollama expects the full chat URL (usually /api/chat) and optionally uses the key
as a Bearer credential. When changing provider, update model, endpoint and key.
Legacy provider-specific fields remain readable; saving through the editor writes
the generic shape. A new provider still needs a compatible backend transport.
