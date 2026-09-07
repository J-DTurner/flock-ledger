# Flock Ledger 1.0

Offline broiler records and harvest-cost planning for Android phones and tablets.

Public-source preparation; remote publication is a separate step. See `PUBLISHING.md`.

**Release status:** this is source code, not a device-tested public Android release. The earlier personalized APK is intentionally not included. See `docs/TEST-REPORT.md` for tests rerun on this public-source variant. Android installation, ART verification, WebView behavior and native document-picker behavior have not been device-tested.

## Install and open

A locally built installable file is named `Flock-Ledger-1.0.apk`; no APK is included in this public source package. The manifest supports Android 8.0/API 26 and later, with target API 34. There are no CPU-specific native libraries. The source ZIP is not the installable file.

Open the APK from Downloads on your phone or tablet. Android may open its “Install unknown apps” permission screen for the browser or file manager that opened it. Grant permission for that source when prompted, return to the installer, and tap Install. Keep Play Protect enabled. Device management or manufacturer-specific restrictions may prevent private APK installation.

After installation, open **Flock Ledger**. No account, server, subscription, internet connection or Play Store listing is needed by the app. It requests no Android permissions. File import/export is through Android's system document picker rather than broad storage access.

Android's official alternative-distribution instructions:
https://developer.android.com/distribute/marketing-tools/alternative-distribution

## Public first launch

This source distribution starts with an empty ledger. Create a batch with your own
purchase date, chick count and cost, or restore your private JSON backup. Existing
saved ledgers are read as-is; the public default never replaces them.

No personal flock records, private signing material, original personalized APK or
screenshots of private records are included. Regression tests use an explicitly
fictional fixture in `tests/fixture.cjs`, which is not included in the compiled app.

## Daily use

**Overview** shows the selected batch, live count status, latest weight, dated weight chart, spending breakdown, known feed inventory and recorded harvest output.

Use **Count birds** to record the actual live flock on a date. Losses and harvests entered after that date reduce the displayed count. Do not record a death and also reduce an earlier count for the same death.

Use **Buy feed** for each dated purchase. Enter the product name, starter/grower/finisher/other phase, total kilograms and total price. Price per kg and the equivalent 50 kg sack price are calculated. Unknown historical kg can remain blank.

For the existing finisher budget, open **Records** and use **Convert to purchase** when the purchase details are available. That replaces the budget instead of counting the same money twice.

Use **Log feed used** for the amount issued/consumed from a particular purchase lot over a period. The period starts just after the start date and ends on the end date; September 7 to September 8 is one daily interval. Use consistent timing and record each period once. Quantities cannot exceed the known purchase quantity. Purchases are not automatically treated as consumption.

Use **Weigh birds** for dated observations. Enter individual weights in kilograms, or a measured sample average and the number weighed. The app calculates mean/minimum/maximum from an individual list. A rough estimate must stay marked as an estimate. Two dated measured samples unlock observed daily gain. A largest-bird weight is not a flock average.

Use **Add record** for losses, other expenses, harvests and notes. Harvest entries record bird count, total live weight, total dressed weight, cash received and dressed kg kept at home. The home-use amount is not booked as cash sales.

For historical feed with missing purchase detail, **Historical feed already used** records the cost already consumed without adding another cash purchase. Use this only for old feed not already covered by the consumption logs. It does not deduct stock from a specific lot. Its amount must be supported by recorded feed purchases.

Entries can be edited or deleted. Data validation prevents deleting a feed purchase while its usage entries remain, impossible bird counts, overconsumption, invalid dates and several common double-counting errors.

## Forecast and slaughter-date costs

Open **Forecast**. Inputs left blank are genuinely unknown; the app will not invent survivors, feed price or a starting production cost.

The starting date, live-bird count, average weight and already-used operating cost must describe the same point in time. **Use latest records** copies the latest observation and only a verified count and known purchase price. **Use logged production costs** copies recorded consumption-based costs, but missing feed logs still make that number incomplete.

The starting production cost includes chick cost, feed already consumed, and other incurred batch expenses at the selected date. It does not automatically include every feed purchase or a future budget. An unopened sack is cash already paid but not yet feed used. Including the entire purchase in the starting cost and charging its modeled future use again would double-count it.

Enter or revise:

- Actual future feed price in PHP/kg and dressed yield percentage.
- Starting daily live gain, daily change in gain, incremental feed conversion ratio (FCR), and daily change in FCR.
- Other daily costs for the whole flock, comparison end day, optional selling/replacement price, and turnaround between batches.

The preset 70% yield, 60 g/day gain, 0.5% daily reduction in gain, 2.2 incremental FCR, 0.03 daily FCR increase and 10-day turnaround are **editable illustrations**, not observations, breed targets, official feed recommendations or a fitted model. No catch-up growth is guaranteed. No future mortality is modeled; run a different explicit scenario for a different survivor count.

With valid inputs, the app shows operating cost per dressed kg across the chosen day range, a separate capital-recovery curve, the lowest cost *within that scenario*, dates within 1% of the low, and dated cost/weight/feed comparisons. A low at the end of the range is flagged, not presented as a confirmed biological optimum.

The harvest-date selector can choose any modeled day. Milestone rows provide quick comparisons. **Export daily comparison CSV** includes every modeled day, its date, weight, feed, cost, output and economics.

### Calculation definitions

For modeled day `t` after the starting point:

```text
gain_kg_per_bird = initial_gain_g / 1000 * (1 - daily_gain_decline_pct/100)^(t-1)
incremental_FCR = initial_FCR + daily_FCR_increase * (t-1)
feed_kg_that_day = birds * gain_kg_per_bird * incremental_FCR
cost_that_day = feed_kg_that_day * feed_price_per_kg + other_daily_flock_cost
projected_dressed_kg = birds * projected_live_weight_per_bird * dressed_yield/100
operating_cost_per_dressed_kg = (starting_used_cost + subsequent_modeled_cost) / projected_dressed_kg
```

The next increment lowers average cost only when its marginal cost per dressed kg is below the existing average. This is arithmetic, not veterinary advice or a promise of performance.

With a partial harvest, manually allocate the starting cost to the remaining birds before forecasting them. The app does not invent a cost allocation between sold and remaining birds.

## Multiple batches, pen recovery and annual scenarios

Create another flock in **Batches**. Records stay separate. Set a batch to closed when appropriate. Shared infrastructure is listed once, separate from feed/chicks. The capital-recovery batch count is editable and does not change the operating-only curve.

The 365-day comparison repeats the selected scenario, including its operating cost and output:

```text
complete_cycles = floor(365 / (growout_days_since_purchase + turnaround_days))
year_one_break_even = (cycles * operating_batch_cost + shared_capital) / (cycles * dressed_batch_kg)
year_one_surplus = cycles * (sales_value_per_batch - operating_batch_cost) - shared_capital
```

This is a capacity scenario, not a calendar booking or a prediction of demand. A longer grow-out can reduce the number of batches. Annual amounts are withheld where a required denominator is invalid. Sales/profit are not fabricated when the price field is blank. A replacement value for meat eaten at home represents potential household savings, not cash profit.

Costs such as labor, medicine, litter, water, transport, processing, refrigeration, selling expenses and repairs are included only when entered. Capital recovery is a planning allocation, not tax depreciation. Feed inventory is batch-specific; automatic inter-batch stock transfers and accounting allocations are not implemented.

## Backup and phone/tablet transfer

Saved records are stored locally in the Android app. There is **no automatic phone/tablet synchronization** and no cloud backup service.

Open **Backup → Export JSON backup**, then choose a local location. To transfer the ledger, move that JSON file to the other device and use **Choose JSON backup file → Validate & restore backup**. The import replaces the entire ledger on that device after confirmation; it does not merge two independently edited copies. Use one device as the primary ledger to avoid divergent edits.

Keep a recent backup outside the app, especially before uninstalling or clearing app data. Storage and backup files have a 4.5 MB safety limit. A corrupt saved ledger is not silently overwritten; the recovery screen exposes the raw data and allows a valid backup to be restored.

The standalone `Flock-Ledger.html` contains the same UI for a browser. It uses separate browser-local storage, not the Android app's storage. Browser policies can affect local-file persistence; JSON transfer is the portable interchange format.

## Verification and limits

See `docs/TEST-REPORT.md` for the public preparation results; local test runs write ignored files under `build/`. The browser UI tests use an explicitly simulated Android storage/file-picker adapter. They do not establish that an Android device installed the package or that a real device's picker and WebView ran correctly. Signing and static DEX checks also do not replace Android runtime testing.

No disease diagnosis, medication advice, breed-specific growth targets, live price feed, cloud synchronization, bank connection, barcode scanner or automatic scale integration is included.

## Developer handoff

`src/app.tsx` is the React UI; `src/core.js` is the pure, independently tested calculation/validation engine. `web/index.html` is a self-contained compiled app. Java source for the offline shell is in `android/app/src/main/java/ph/flockledger/app/`.

The packaged UI uses vendored React 16.0.0 / ReactDOM 16.0.1 from the available local environment. These are not current versions. No installation from npm or network access is needed to run the supplied app. Maintainers should modernize dependencies and perform Android device tests before a broader release. See `THIRD-PARTY-LICENSES.txt`.

### Rebuild the UI

```bash
npm install
npm test
npm run build
```

TypeScript 5.8.3 is pinned in `package.json`; a compatible global installation is also accepted. The build transpiles TSX and packages local assets; it does not claim full TypeScript type checking. Calculation tests require Node.js, without npm packages.

### Standard Android source project

Open the `android` folder in Android Studio with SDK platform 34 installed, or use a compatible local Gradle installation. The project pins Android Gradle Plugin 8.7.3, Java 8 source compatibility, API 26 minimum and API 34 target. A Gradle wrapper binary is not bundled. This conventional Gradle route was not executed in this environment, because no Android SDK was available.

Build unsigned release through the standard Android tooling, then sign it using a privately stored certificate. Signing files must never be committed. Increase the version code for updates. The package ID is `ph.flockledger.app`. Android updates require the same package/signing identity (or an appropriate key-rotation lineage):
https://developer.android.com/google/play/app-updates

### How the delivered APK was built here

The environment had Java, Python and Node, but no Android SDK/Gradle. The included `tools/dexbuild.py`, `tools/native_shell.py` and `tools/android_binary.py` generate the fixed three-class shell's DEX, binary manifest and minimal icon resource table. They are not a general Java compiler. Java files are the maintainable equivalent source; an APK assembled by this route uses the fixed instruction emitter, not javac output.

```bash
python -m pip install -r requirements-build.txt
node tools/build-web.cjs
python tools/package_apk.py
python tests/apk-structure.py
```

The packaging script also requires JDK `jarsigner`. It writes `Flock-Ledger-1.0.apk` alongside the source folder and keeps signing material in a separate sibling `flock-ledger-private-signing` folder. To preserve an existing installation’s certificate, restore your privately held signing folder there before packaging. If it is absent, the script creates a **new** key, which cannot update an installation signed with the old key.

A private signing backup contains private key material and its password. Keep it private; it is not a user-data backup and is not needed just to install or use the app. Do not publish it with source code.

The SDK-free route was tested for DEX structure and APK v1/v2 signatures, but not by ART or an emulator. For production maintenance, prefer the standard Android build/toolchain and device testing.

## Licensing

No license for the original application code is selected by this publication-preparation step.
Public visibility alone does not grant an additional license. Existing third-party notices
remain in `THIRD-PARTY-LICENSES.txt`.
