# Daily Standup Generator

Turns a list of GitHub issues and PRs into a standup update (Completed, In Progress, Upcoming, PR Review) with titles, links, ETAs and review status. Copy pastes as rich text into Slack or Google Docs, and as Markdown elsewhere.

Live: https://joaquinangelino.github.io/daily-standup-generator/

## Use

1. Open **Settings**, paste a GitHub token and list your repositories (`owner/repo`, one per line; the first is the default).
2. Add issues and PRs as `123`, `owner/repo#123` or a full GitHub URL. Rows persist in your browser between visits.
3. **Generate**, edit the output if needed, **Copy**.

## Token

The app only reads issues and pull requests. Prefer a fine-grained token limited to those repos with read-only **Issues** and **Pull requests**. Fine-grained tokens cannot always reach repos where you are only a collaborator on another person's account; there a classic token with `repo` scope is needed, so keep **Remember on this device** off.

The token stays in your browser and is sent only to `api.github.com`. Without **Remember**, it lives in `sessionStorage` and is gone when the tab closes.

## Develop

No build step. Serve the folder and open it:

```sh
npm start   # python3 -m http.server 8000
npm test    # node --test
```
