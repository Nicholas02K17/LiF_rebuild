# Repository contracts

Each file here declares a **named interface** that the presentation layer is
allowed to depend on. Nothing in `src/` may talk to a database, an HTTP client
or a fixture file directly — it goes through one of these contracts.

When this presentation layer is lifted into the authoritative LiF Node.js /
Express application, the host binds its own real repositories to these names in
`src/repositories/index.js`. No controller, service, view model or EJS template
changes.

Every method is documented with: the authoritative entity, the stable ID, the
permission rule the **server** enforces, and the shape returned. Permission-
sensitive counts are calculated *after* authorization (AI Run Instructions v2.1
§6) — a repository never returns rows the viewer may not see.
