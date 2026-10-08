# Monthly Money

A budgeting app in a single HTML file. It tracks a credit-card statement cycle day by day, splits shared household bills, and projects savings, a trip fund and a 0% balance-transfer card. There's no server, no account and nothing to install: your numbers stay in your browser.

Open `index.html`, or host the folder (see [Hosting](#hosting-on-github-pages)) and add it to your phone's home screen.

## What it does

- **Today.** Add purchases against a statement cycle (statement day 1 to 28). It shows what's safe to spend per day, your pace, a blended projection of the final bill and when it will be debited. The cycle rolls over by itself the day after the statement day.
- **Budget.** Take-home pay against your monthly lines (fixed, saving, spending). Each line has a role (Amex, Trip fund, 0% card, Savings, ISA, Joint account, none) that links it to the other tabs.
- **Amex.** Per-category spend derived from your purchases, a history of finished cycles, and a lock so a reconciled cycle can't change.
- **Joint.** Shared bills against what you pay into the joint account: your share, whether you're over or under, and what the partner pays in.
- **Goals.** A trip fund with a departure date, a savings and ISA outlook, and a 0% card tracker that tells you whether your monthly payment clears the balance before the promotional rate ends.

All money is stored as whole pence, so there's no floating-point drift.

## Your data

- Everything is saved in your browser's `localStorage`. Nothing is sent anywhere, and a strict Content-Security-Policy stops the page making network requests.
- **Clearing site data deletes your numbers.** Use **Goals → Download backup** regularly. The app shows when you last made one and warns after 14 days.
- Restoring a backup validates it first and keeps a copy of your current data. Old backup formats (v1 to v4) are upgraded automatically.
- Backups are plain JSON containing your budget, so treat them like a bank statement. The `.gitignore` in this repo keeps `monthly-money-*.json` and `my-*.json` out of commits.

On an iPhone, Safari can clear a website's storage after about a week without a visit. A home-screen web app isn't subject to that, so install it (Share → Add to Home Screen) once it's hosted.

## Hosting on GitHub Pages

1. Create a repository and push these files, with `index.html` in the root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

Each address has its own storage. If you move from a local file to the hosted page, download a backup first and restore it on the new address.

## Developing

```
npm install
npm test
```

Tests run the app in jsdom with a fixed clock and cover cycle boundaries, purchases, history and locking, migrations from every older format, the joint and 0% card maths, HTML escaping, and a scan that fails if personal terms creep into the source.

The script is split into numbered sections with a state-shape comment at the top. Add a migration step to `migrate()` and bump `STATE_VERSION` whenever the saved shape changes, and add a test that restores an old backup.

## Limits

- It's a planning tool, not financial advice. Projections assume your rates hold and don't model tax.
- One person's data per browser. There's no sync between devices; move data with backup files.
- Amounts are in pounds sterling.

## Licence

MIT. See [LICENSE](LICENSE).
