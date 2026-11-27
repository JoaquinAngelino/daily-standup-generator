# Daily Standup Generator

Turns a list of GitHub issues and PRs into a standup update (Completed, In Progress, Upcoming, PR Review) with titles, links, ETAs and review status. **Copy for Slack** pastes formatted text; **Copy for GitHub** pastes the Markdown as is.

Live: https://joaquinangelino.github.io/daily-standup-generator/

## Use

1. Open **Settings**, paste a GitHub token and list your repositories (`owner/repo`, one per line; the first is the default).
2. Add issues and PRs as `123`, `owner/repo#123` or a full GitHub URL.
3. **Generate**, edit the output if needed, then copy it for Slack or GitHub.

Everything saves as you type and survives browser restarts.

The **Tracker** tab keeps a longer-lived list of issues, PRs or free-text tasks in three sections: Not started, In progress and Done. Each task shows its GitHub state, its assignees and its related PRs (which you can add or remove), and can have a status (Blocked, Waiting for review and so on), a priority, an ETA and a note. Lanes sort by priority or by ETA, or by hand: drag an item by its grip. **Add to standup** puts the task in the matching standup lane. **Add personal** creates a task with no issue or repo, for things outside the project; the **Show** filter switches between work, personal or all tasks.

## Token

The app only reads issues and pull requests. Prefer a fine-grained token limited to those repos with read-only **Issues** and **Pull requests**. Fine-grained tokens cannot always reach repos where you are only a collaborator on another person's account; there a classic token with `repo` scope is needed.

The token is sent only to `api.github.com`. With **Remember on this device** (the default) it is kept in `localStorage`, which every GitHub Pages site under `joaquinangelino.github.io` can read. Uncheck it to keep the token only until the tab closes.

## Sync

**Settings → Sync to repository** keeps the standup and the tracker the same on every device. Enter an `owner/repo` (a private repo of yours is best), a branch (`standup-data` by default, created from the default branch if missing) and a passphrase. The token then also needs **Contents: read and write** on that repo.

The data is compressed and encrypted in the browser (AES-256-GCM, key from the passphrase through PBKDF2-SHA256 with 600,000 iterations) and saved as `standup.enc` on that branch, so GitHub and anyone with access to the repo cannot read it. Use the same passphrase, of at least 8 characters, on every device; a lost passphrase cannot be recovered, and neither can the file. The passphrase is stored like the token, following **Remember on this device**. Language, the tracker filter and whether the output panel is open stay per device.

Changes save 30 seconds after the last edit, when you leave the tab, or with **Sync now**; each save is a commit on the branch. Changes from other devices arrive when the app opens, when you come back to it after 2 minutes or more, or with **Sync now**. Edits from two devices merge per field of each item; when both change the same field, the last one synced wins, and editing an item another device deleted brings it back. **Stop syncing** forgets the repo and passphrase on this device and leaves the file as it is.

## Develop

No build step. Serve the folder and open it:

```sh
npm start   # python3 -m http.server 8000
npm test    # node --test
```
