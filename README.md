# Daily Standup Generator

Turns a list of GitHub issues and PRs into a standup update (Completed, In Progress, Upcoming, PR Review) with titles, links, ETAs and review status. **Copy for Slack** pastes formatted text; **Copy for GitHub** pastes the Markdown as is.

Live: https://joaquinangelino.github.io/daily-standup-generator/

## Use

1. Open **Settings**, paste a GitHub token and list your repositories (`owner/repo`, one per line; the first is the default).
2. Add issues and PRs as `123`, `owner/repo#123` or a full GitHub URL.
3. **Generate**, edit the output if needed, then copy it for Slack or GitHub.

Everything saves as you type and survives browser restarts.

The **Tracker** tab keeps a longer-lived list of issues, PRs or free-text tasks in three sections: Not started, In progress and Done. Each task shows its GitHub state, its assignees and its related PRs (which you can add or remove), and can have a status (Blocked, Waiting for review and so on), a priority, an ETA and a note. Lanes sort by priority or by ETA, or by hand: drag an item by its grip. **Add to standup** puts the task in the matching standup lane.

## Token

The app only reads issues and pull requests. Prefer a fine-grained token limited to those repos with read-only **Issues** and **Pull requests**. Fine-grained tokens cannot always reach repos where you are only a collaborator on another person's account; there a classic token with `repo` scope is needed.

The token is sent only to `api.github.com`. With **Remember on this device** (the default) it is kept in `localStorage`, which every GitHub Pages site under `joaquinangelino.github.io` can read. Uncheck it to keep the token only until the tab closes.

## Develop

No build step. Serve the folder and open it:

```sh
npm start   # python3 -m http.server 8000
npm test    # node --test
```
