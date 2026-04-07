# 💶 Personal Budget Tracker

A personal monthly budget tracker built as a single-file web app. Runs entirely in the browser — no backend, no server, no account needed. Data is saved locally on your device.

> Designed to be used as a mobile web app on iPhone via Safari "Add to Home Screen".

---

## ✨ Features

### Overview
- **Net Income** — editable monthly income field
- **Groceries** — separate variable cost input, included in all calculations
- **Total Costs** — fixed installments + groceries, with percentage of income used
- **Remaining This Month** — what's left after all costs
- **Savings Goal** — set a monthly savings target with progress bar
- **Buffer Alert** — get a warning if remaining drops below a threshold you set
- **This Pay Cycle** — payments hitting between today and your next payday
- **Due Next 7 Days** — upcoming payments in the next week
- **Smart Alerts** — end-date warnings for expiring payments, overspend alerts

### Forecast (6-Month View)
- **Bar Chart** — Fixed costs vs Net remaining vs Groceries per month
- **Trend Line** — total cost trajectory as installments expire over time
- **Donut Chart** — cost breakdown by category for the current month
- **Month Cards** — expand any month to see a full payment breakdown, expired payments shown separately
- **Heavy Month Detection** — months with above-average costs are flagged automatically

### Payments List
- Filter by **date range** (1–10, 11–20, 21–25, 26–31)
- Filter by **type** (Monthly / One-Time)
- Filter by **tag** (Essential ✅ / Optional ✨)
- **Optional savings hint** — shows how much you'd save by cancelling optional payments
- Add **notes** to any payment
- **Due Soon** badge on payments hitting within 7 days

### Other
- **Payday setting** — configure your payday, used for countdowns and pay-cycle calculations
- **Export** — generates a plain-text summary you can copy to clipboard or paste into a spreadsheet
- **Fully offline** — no internet required after first load (fonts load from Google Fonts)
- **Persistent storage** — all data saved in browser `localStorage`

---

## 📱 How to Use on iPhone

1. Open the live URL in **Safari**
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Give it a name and tap **Add**

It will appear on your home screen and launch full-screen like a native app.

---

## 🚀 Live App

👉 **[Open Budget Tracker](https://yourusername.github.io/budget-tracker)**

> Replace with your actual GitHub Pages URL after setup.

---

## 🗂 Payment Categories

| Category | Colour | Examples |
|---|---|---|
| O2 Installments | Purple | iPhone, Internet, Nintendo |
| Installments | Orange | Otto, Philips, appliances |
| Subscriptions | Blue | YouTube, iCloud, BVG |
| PayPal | Teal | Douglas, Swarovski, Bikes |
| Home | Green | Rent, Electricity |
| Other | Lime | Custom entries |

---

## 🔄 Updating the App

When a new version of `index.html` is available:

1. Go to this repository on GitHub
2. Click `index.html`
3. Click the **pencil ✏️ icon** to edit
4. Select all → paste the new code
5. Click **Commit changes**

The live URL updates automatically within seconds.

---

## 🗄 Data & Privacy

- All budget data is stored **locally in your browser** (`localStorage`)
- **Nothing is sent to any server**
- The GitHub repository contains only the app code — no personal financial data
- Clearing your browser data will reset the app to default values

---

## 🛠 Tech Stack

| | |
|---|---|
| Language | HTML / CSS / JavaScript (vanilla) |
| Charts | Native Canvas API (no library) |
| Storage | Browser `localStorage` |
| Fonts | DM Sans + DM Serif Display (Google Fonts) |
| Hosting | GitHub Pages |
| Dependencies | None |

---

## 📋 Default Payments Loaded

The app comes pre-loaded with the following recurring costs as a starting point. You can delete or edit any of them.

| Payment | Amount | Day | Category |
|---|---|---|---|
| Rent | €990.00 | 1st | Home |
| Tickets BVG | €126.00 | 1st | Subscriptions |
| Zahnzusatz-Vers. | €23.57 | 1st | Subscriptions |
| Electricity | €100.00 | 14th | Home |
| iPhone 17 + AirPods | €88.00 | 23rd | O2 |
| Nintendo | €16.00 | 23rd | O2 |
| Infrared Heater | €23.33 | 24th | Installments |
| The Local | €5.99 | 25th | Subscriptions |
| iPhone 16 | €64.50 | 28th | O2 |
| SMEG | €28.06 | 29th | PayPal |
| Internet | €66.00 | 30th | O2 |
| ... and more | | | |

---

## 📝 Changelog

### v6 — Current
- Added groceries as a separate editable cost
- Savings goal with progress tracking
- Buffer alert threshold
- Pay-cycle view (today → next payday)
- Essential / Optional payment tags
- Notes field per payment
- End-date expiry alerts
- Export to plain text
- Donut chart (category breakdown)
- Trend line chart (cost over 6 months)

### v5
- 6-month forecast with bar chart
- Smart month cards with expandable breakdown
- Heavy month detection

### v4
- Payday setting
- Due in 7 days card
- Due-soon badges on payment list

### v3
- Initial public version
- Overview dashboard
- Date range filters
- One-time vs monthly tabs

---

## 📄 License

Personal use only. Not intended for redistribution.
