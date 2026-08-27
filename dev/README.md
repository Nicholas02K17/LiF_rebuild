# /dev — development and review fixtures

**Nothing in `src/` imports this except `src/repositories/index.js`, and only
when `LIF_DATA_ADAPTER=dev`.** `src/config/index.js` throws at boot if that
value is seen with `NODE_ENV=production`.

These records exist so the Hub can be reviewed against realistic, populated,
empty, restricted and error data before the authoritative backend is connected
(AI Run Instructions v2.1 section 7). Every record carries
`datasetId: 'lif-dev-hub'` so a cleanup command can target exactly this set and
prove unrelated records remain.

To review a non-ideal state without editing code, use the query flags on `/`:

| Flag | What it shows |
| --- | --- |
| `?state=empty` | A brand-new Member: pathway untouched, every card empty |
| `?state=loading` | Cards held in their calm progress state |
| `?state=error` | A summary that failed to load, with entered work safe |
| `?state=dense` | High counts and a long activity list |
| `?state=restricted` | A card the viewer may not open, explained without leaking |
