# Security and private data

Do not post farm JSON backups, private flock records, API tokens or signing keys in
public issues, commits or pull requests. Use synthetic records when reproducing a bug.

Signing material is stored outside the source tree and ignored defensively. APKs
must be rebuilt from the empty public default before public distribution; the original
personalized APK embeds private starter records and is not included here.

No Android runtime testing is claimed. Do not mistake static APK checks or browser
adapter tests for installation/ART/WebView verification on an Android device.
