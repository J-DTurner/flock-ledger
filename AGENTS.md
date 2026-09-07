# Maintenance notes

- React TSX UI: `src/app.tsx`; dependency-free calculations/validation: `src/core.js`.
- Build both the standalone HTML and Android asset with `npm run build`.
- Run `npm test`; browser tests are `python tests/ui-smoke.py` and `python tests/ui-workflows.py`, and `python tests/public-onboarding.py`.
- Public first launch must stay empty. Use `tests/fixture.cjs` for synthetic test data only.
- Do not publish private backups, signing files, personalized APKs or real farm screenshots.
- Chicks, purchased feed, consumed feed, budgets, capital and cash revenue are distinct ledgers.
- Weight estimates are not measured samples. Forecast inputs remain explicit scenarios.
- Blank counts/prices must not be replaced with invented data or an inferred biological curve.
- Daily forecast cost uses measured/entered baseline production cost plus modeled future use.
- Preserve schema-version-1 imports, including older private ledgers, without overwriting data.
- No Android runtime validation is claimed; browser adapters and structural APK tests do not substitute for it.
- Publishing permission is separate from read access. Do not report a GitHub repository as created without verifying it remotely.
