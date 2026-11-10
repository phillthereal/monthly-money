# Monthly Money

A budgeting app in a single HTML file. It tracks a credit-card statement cycle day by day, splits shared household bills, and projects savings, a trip fund and a 0% balance-transfer card. There's no server, no account and nothing to install: your numbers stay in your browser.

To try it, download `index.html` (the **Code → Download ZIP** button gives you everything) and open it in your browser. There is no hosted copy. You can also host the folder yourself (see [Hosting](#hosting-on-github-pages)) and add it to your phone's home screen.

## What it does

- **Today.** Add purchases against a statement cycle (statement day 1 to 28). It shows what's safe to spend per day, your pace, a blended projection of the final bill and when it will be debited. The cycle rolls over by itself the day after the statement day.
- **Budget.** Take-home pay against your monthly lines (fixed, saving, spending). Each line has a role (Amex, Trip fund, 0% card, Savings, ISA, Joint account, none) that links it to the other tabs.
- **Amex.** Per-category spend derived from your purchases, a history of finished cycles, and a lock so a reconciled cycle can't change. Import one or more statement CSVs: each purchase goes to the cycle its date belongs to, only the shop name is kept, and anything already imported is skipped. A pop-up sorts purchases that have no category, one pick per shop.
- **Spending.** A ring of spending by category for any month, spent-against-plan bars, a day-by-day calendar, top shops, and "Where to cut": what your goals are short by each month and which categories could cover it, worked out from your past months. Subscriptions are listed only when you add them; nothing is guessed.
- **Joint.** Shared bills against what you pay into the joint account: your share, whether you're over or under, and what the partner pays in.
- **Goals.** A trip fund with a departure date, a savings and ISA outlook, and a 0% card tracker that tells you whether your monthly payment clears the balance before the promotional rate ends.

All money is stored as whole pence, so there's no floating-point drift.

## Your data

- Everything is saved in your browser's `localStorage`. The GitHub Pages or plain-file copy sends nothing anywhere (when the same file runs as a Claude artifact it can also keep a copy in the signed-in person's own Claude account), and a strict Content-Security-Policy stops the page making network requests.
- **Clearing site data deletes your numbers.** Use **Goals → Download backup** regularly. The app shows when you last made one and warns after 14 days.
- Restoring a backup validates it first and keeps a copy of your current data. Old backup formats (v1 to v4) are upgraded automatically.
- Backups are plain JSON containing your budget, so treat them like a bank statement. The `.gitignore` in this repo keeps `monthly-money-*.json` and `my-*.json` out of commits.

On an iPhone, Safari can clear a website's storage after about a week without a visit. A home-screen web app isn't subject to that, so install it (Share → Add to Home Screen) once it's hosted.

## Security and privacy

- **No network.** The Content-Security-Policy sets `connect-src 'none'` and loads nothing from other sites: fonts and icons are inside the file.
- **Only the app's own script runs.** The script policy allows the one inline script by its hash and nothing else; `node scripts/csp.js` refreshes the hash (the commit hook does it automatically).
- **Imported and restored data is treated as text.** Shop names, category names and everything else in a CSV or backup are escaped before they reach the page. `tests/xss.test.js` fills every text field with markup and checks that none of it becomes an element or an event handler.
- **Imported shop names can still say where you shop.** Card statements often put a town or area after the shop name. The import drops the padded town column, reference codes and store numbers, but an area written as part of the name stays. It is stored only in your browser; keep it in mind before sharing a backup or a screenshot.
- **Keeping your own data out of commits.** `scripts/privacy-scan.js` compares the files being committed with private files on your machine (a backup named `my-starter-backup.json`, a word list at `tests/private-terms.txt`, statement CSVs in `~/Downloads`) and stops the commit on a match. `npm install` switches it on (the hooks live in `.githooks/`).

- Found a problem? Open an issue without including any real financial data.

## Hosting on GitHub Pages

1. Create a repository and push these files, with `index.html` in the root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

Pages on the same address can read each other's saved data, and every project page of one GitHub account shares one address (`<your-username>.github.io`). Only host it next to pages you trust.

Each address has its own storage. If you move from a local file to the hosted page, download a backup first and restore it on the new address.

## Developing

```
npm install
npm test
```

Tests run the app in jsdom with a fixed clock and cover cycle boundaries, purchases, history and locking, migrations from every older format, the joint and 0% card maths, CSV import, the Spending analysis, HTML escaping with hostile data, and a scan that fails if personal terms creep into the source.

The script is split into numbered sections with a state-shape comment at the top. Add a migration step to `migrate()` and bump `STATE_VERSION` whenever the saved shape changes, and add a test that restores an old backup.

## Limits

- It's a planning tool, not financial advice. Projections assume your rates hold and don't model tax.
- One person's data per browser. The GitHub Pages or plain-file copy has no sync between devices (move data with backup files); as a Claude artifact it can keep a copy in the signed-in person's own Claude account.
- Amounts are in pounds sterling.

## Licence

MIT. See [LICENSE](LICENSE).
