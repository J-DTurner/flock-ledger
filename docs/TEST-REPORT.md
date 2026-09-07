# Public-source preparation — verification report

Prepared September 7, 2026. **This repository has not yet been published to GitHub.**

## Tests rerun on this variant

| Area | Result | Scope |
|---|---|---|
| Domain calculations and validation | 36 passed | Includes empty public startup, first-batch state, historical ledgers, inventory, forecasts, accounting and backup validation |
| UI workflows | 18 passed | Browser UI with a simulated native storage/document-picker adapter and a fictional fixture |
| Public onboarding workflows | 3 passed | First batch creation, empty backup export, existing ledger restoration |
| Responsive first launch | 3 viewports passed | Empty onboarding at phone, tablet and desktop widths |
| Publisher safety tests | 8 passed | Simulated Git/gh responses; verifies public flag, account identity, clean tree, existing-origin refusal, visibility and SHA checks |
| Compiled web assets | Rebuilt successfully | Both standalone HTML and Android asset are regenerated from public source |

`tests/fixture.cjs` contains deliberately synthetic data and is never packaged into
the app. Screenshots were regenerated from empty public onboarding or fictional
workflow state. The original personalized APK and its screenshots are excluded.

## Not performed

No authenticated GitHub write, repository creation or push was available. Publisher
tests simulate command responses; they are not evidence of a published repository.

No Android APK was rebuilt for public release in this preparation step. No Android
emulator or physical device was available. The earlier APK's static checks do not
establish that this public source variant installs or runs on an Android device.
The conventional Gradle build was not run. Browser adapter tests are not ART,
WebView, real persistence, real document-picker, or lifecycle tests.

Forecast presets are editable economic scenarios, not validated growth predictions.
