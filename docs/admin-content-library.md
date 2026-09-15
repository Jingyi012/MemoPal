# Admin content library

Open **Content Studio → Content library**. The workspace shows all lessons,
unassigned lessons, and collections in a folder sidebar. Search matches English
titles, Chinese titles, and stable keys. Status and category filters are stored
in the URL. Lesson editors have direct URLs, including collection-scoped routes.

## Managing content

- **New collection** opens bilingual details, lesson membership/order, and
  publishing settings. Saving opens that collection's workspace.
- **New lesson** creates a standalone lesson from All/Unassigned, or creates it
  inside the currently open collection. Creation and membership are saved in
  one backend operation.
- Click a lesson title or its edit action to manage bilingual metadata, content
  items, item order, technique, starter status, and publication.
- Drag a lesson row onto a sidebar collection to move it. **Move to** provides
  the same operation without dragging. Moving to Unassigned removes its sole
  collection membership. Published collections cannot lose their last lesson
  through a move; unpublish them first.
- Existing lessons may belong to multiple collections. A move removes only
  the selected source membership. From All lessons, the move dialog asks for a
  source when multiple memberships exist. The collection editor can still add
  an existing lesson while preserving its other memberships.
- Up/down controls persist lesson order inside a collection, independently of
  the lesson's catalogue sort order.
- Deleting a collection preserves its lessons and downloaded user copies.
  Deleting a lesson removes all active collection memberships; collections left
  empty become drafts. Both actions require a confirmation in the UI.

## Backend contracts

All routes require the existing Admin role.

- `POST /admin/memory-collections/lessons/{lessonId}/move` accepts
  `sourceCollectionId`, `targetCollectionId`, `expectedSourceVersion`,
  `expectedTargetVersion`, and `expectedLessonVersion`. A null source means
  currently unassigned; a null target removes the source membership. The
  operation validates membership, publication, capacity, and versions before
  saving the affected collections and lesson in one `SaveChangesAsync` call.
- `DELETE /admin/memory-collections/{collectionId}?expectedVersion=N` soft
  deletes the collection without deleting lessons.
- Lesson creation accepts optional `collectionId` and
  `expectedCollectionVersion`. Existing standalone callers remain compatible.
- Lesson and collection updates use version checks. The
  `ProtectLessonConcurrentEdits` migration records the EF lesson concurrency
  token; it requires no physical column changes. Persistence concurrency
  failures in this feature return HTTP 409.

After updating a running development checkout, restart the API so it loads the
new endpoints and applies the migration through the normal startup process.

## Validation

Behavior is covered by `MemoryCollectionsPage.test.tsx`,
`ContentLibraryManagementTests`, and `ContentLibraryEndpointsTests`. Run the
repository checks documented in `AGENTS.md`. Browser layout checks can use
isolated fixtures; never create or move real library content just to test UI.

## Related content workspaces

The Content Studio menu and page navigation keep three workspaces together:
Content library for collections and lessons, Palace scenes for visual templates,
and Categories for topic organization. `/admin/content` opens the library.

Palace scenes has a gallery/table switch and filters for text, publication, and
Premium access. Scene editors use `/admin/content/palace-scenes/{sceneId}` (or
`new`) with a large canvas, ordered memory route, and settings/point inspector.
Markers support drag, arrow keys, and coordinate fields. Uploads use the existing
media pipeline; saving and leaving are disabled during upload or save.

Categories shows lesson and collection usage, bilingual search, and visibility
filters. Lesson counts link to the filtered library. Hiding an active category
requires confirmation. Categories referenced by active lessons or collections
cannot be deleted; both the interface and server enforce this restriction.
