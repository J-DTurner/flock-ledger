# Publish the prepared repository

**Preparation status: local only. No GitHub repository was created in the preparation environment.**
The connected GitHub tool exposed reads, but no create/push action. The workspace also
had no authenticated GitHub CLI. The intended destination is `J-DTurner/flock-ledger`.

This directory includes a clean initial Git commit on `main`. Extract the whole
archive, including its hidden `.git` directory. With Node.js, Git, and GitHub CLI
available, run this command from `flock-ledger`:

```sh
node tools/publish-github.cjs
```

The publisher checks its dependencies, the initial branch, a clean working tree,
tracked credential/signing-file patterns, and the empty public app default. It
opens GitHub's browser login flow when no authenticated CLI session is available,
then requires the authenticated account to be `J-DTurner`. Never paste a token
or signing key into a chat or into this repository.

It creates **a new public repository**, pushes `main`, and reads back the public
visibility and remote commit to verify publication. It refuses an existing `origin`
and never overwrites an existing repository or changes an existing private repository.
A network error or conflicting repository name stops the command instead of reporting
success. This is a first-publication helper, not a general update/deployment tool.

GitHub CLI installation: https://cli.github.com
Official create command: https://cli.github.com/manual/gh_repo_create
Official browser authentication: https://cli.github.com/manual/gh_auth_login

## What is safe to publish here

The app source, empty first-launch UI, synthetic tests, regenerated screenshots,
build tools and documentation are included. Private seed records, personalized APK,
original screenshots, saved ledgers, signing backup and credentials are excluded.

The separate private Android signing backup must remain outside this repository.
No public APK release is prepared by this step; Android runtime testing remains open.

The helper was exercised with simulated CLI responses. Remote repository creation
and upload cannot be integration-tested without an authenticated publishing session.
