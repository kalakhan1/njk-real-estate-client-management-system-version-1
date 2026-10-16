# Herbal Master Factory — Client Manager

A comprehensive Google Apps Script web application for managing clients, services, communications, and team users. Built as a single-page application (SPA) with Google Sheets as the backend database.

**Version:** 2.1.1  
**Platform:** Google Apps Script  
**Database:** Google Sheets  
**Author:** Herbal Master Factory

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Prerequisites](#-prerequisites)
3. [Project Structure](#-project-structure)
4. [Installation — Pull from Apps Script](#-installation--pull-from-apps-script)
5. [Installation — Clone from GitHub](#-installation--clone-from-github)
6. [Setup as New Google Apps Script Project](#-setup-as-new-google-apps-script-project)
7. [Push to GitHub](#-push-to-github)
8. [Daily Development Workflow](#-daily-development-workflow)
9. [Troubleshooting](#-troubleshooting)
10. [Security Notes](#-security-notes)
11. [Version History](#-version-history)

---

## ✨ Features

### Core Modules
- **3 User Roles**: Admin, Normal User, Custom User with granular permissions
- **Client Management**: Full CRUD with Area, Deal Type, Area Size & Unit
- **Service Tracking**: Add, view, and delete services per client with creator attribution
- **WhatsApp Integration**: 5 message options (Welcome/Reminder in Roman Urdu & English + Blank)
- **Global Search**: Professional multi-field filters with Min/Max area size range
- **User Management**: Admin can create Normal/Custom users
- **Bilingual UI**: Toggle between Roman Urdu and English globally
- **Settings**: Company details, 4 message templates, session config

### Dashboard
- 4 tabs: **All** • **Active** • **Inactive** • **Current Working**
- Live stats: Total, Active, Inactive, Working counts
- Real-time search filter (name, phone, email, area)

### Area Size Support
- Units: `sqft`, `sqyds`, `sqmtr`, `acres`
- Range filter: Min–Max between any unit

### Design
- Responsive: Mobile (320px+), Tablet, Desktop
- Navy + Gold theme with clean typography
- Toast notifications, confirmation modals
- Role-based UI (buttons hide automatically)

---

## 🔧 Prerequisites

Before setting up this project, install:

| Tool | Minimum Version | Purpose |
|------|-----------------|---------|
| [Node.js](https://nodejs.org/) | 20.0.0+ | Required for clasp |
| [Git](https://git-scm.com/) | Latest | Version control |
| [VS Code](https://code.visualstudio.com/) | Latest | Code editor |
| [Google Account](https://accounts.google.com/) | — | Apps Script access |

### Verify Installations

```bash
node --version      # v20.x.x or higher
npm --version       # 10.x.x or higher
git --version       # git version 2.x.x
clasp --version     # @google/clasp x.x.x
```

If `clasp` is not installed:
```bash
npm install -g @google/clasp
```

---

## 📁 Project Structure

```
herbal-master-factory-gas/
│
├── Backend (.gs → .js after clone)
│   ├── Config.gs              # Constants, headers, default settings
│   ├── Utils.gs               # Helpers (phone, date, sanitize, hash)
│   ├── ErrorHandler.gs        # safeCall_, response wrappers
│   ├── Auth.gs                # Login, session, RBAC, lockout
│   ├── Router.gs              # doGet, include
│   ├── Setup.gs               # Sheet setup & migration
│   ├── Users.gs               # User CRUD (admin only)
│   ├── Clients.gs             # Client CRUD with RBAC
│   ├── Services.gs            # Service CRUD
│   ├── Messages.gs            # WhatsApp message builder
│   ├── Settings.gs            # Settings CRUD
│   └── Search.gs              # Multi-field search
│
├── Frontend (.html)
│   ├── Index.html             # Main SPA structure (8 views)
│   ├── Login.html             # Login screen
│   ├── Styles.html            # Responsive CSS (Bootstrap 5 + custom)
│   └── Scripts.html           # Frontend logic + i18n
│
├── Config Files
│   ├── appsscript.json        # Apps Script manifest
│   ├── .clasp.json            # clasp config (Script ID)
│   ├── .claspignore           # Files to exclude from clasp push
│   ├── .gitignore             # Files to exclude from Git
│   └── package.json           # npm config
│
└── README.md                  # This file
```

---

## 📥 Installation — Pull from Apps Script

If your code currently lives in Google Apps Script and you want to pull it into VS Code:

### Step 1 — Enable Apps Script API

Open in **browser** (not terminal):

```
https://script.google.com/home/usersettings
```

Toggle **Google Apps Script API** to **ON**. Sign in with the same Google account that owns the project.

> ⚠️ **Critical:** Without this, all `clasp` commands fail with `User has not enabled the Apps Script API`.

### Step 2 — Login via clasp

```bash
clasp login
```

Browser opens → choose your Google account → **Allow**.

Verify:
```bash
clasp login --status
```

### Step 3 — Get Script ID

1. Open your project: https://script.google.com
2. Click **⚙️ Project Settings**
3. Copy the **Script ID** (long alphanumeric string)

### Step 4 — Create Local Folder

```bash
mkdir herbal-master-factory-gas
cd herbal-master-factory-gas
```

### Step 5 — Clone

```bash
clasp clone "YOUR_SCRIPT_ID_HERE"
```

### Step 6 — Verify

```bash
ls -la
clasp status
```

You should see all `.js` files, `.html` files, `appsscript.json`, and `.clasp.json`.

### Step 7 — Install Google Apps Script Types (IntelliSense)

```bash
npm init -y
npm install -D @types/google-apps-script
```

Now VS Code will autocomplete `SpreadsheetApp`, `HtmlService`, `Utilities`, etc.

### Step 8 — Test Pull/Push

```bash
clasp pull
clasp push -f
```

---

## 📥 Installation — Clone from GitHub

If you want to set up this project on a new machine using the GitHub repository:

### Step 1 — Clone Repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/herbal-master-factory-gas.git
cd herbal-master-factory-gas
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Login to clasp

```bash
clasp login
```

### Step 4 — Configure `.clasp.json`

Create/edit `.clasp.json` in the project root:

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```

Replace `YOUR_SCRIPT_ID` with the Script ID of your new Apps Script project.

### Step 5 — Push to Apps Script

```bash
clasp push -f
```

### Step 6 — Initialize Database

Open the Apps Script editor:
```bash
clasp open
```

Select function **`setupProject`** → **▶️ Run** → authorize.

This creates all required sheets and seeds default users.

---

## 🚀 Setup as New Google Apps Script Project

Complete workflow to deploy this project as a **brand new** Apps Script project bound to a **new** Google Sheet.

### Step 1 — Create a New Google Sheet

1. Go to [sheets.new](https://sheets.new)
2. Rename: **`Herbal Master Factory — Database`**
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### Step 2 — Create a Bound Apps Script Project

**Method A — Via UI (Recommended):**

1. Open your new Sheet
2. Go to **Extensions → Apps Script**
3. A new bound script project opens
4. Rename it: **`Herbal Master Factory`**
5. Copy the **Script ID** from **⚙️ Project Settings**

**Method B — Via clasp:**

```bash
clasp create --title "Herbal Master Factory" --type sheets --parentId "YOUR_SHEET_ID"
```

### Step 3 — Configure `.clasp.json`

In your local project root, edit `.clasp.json`:

```json
{
  "scriptId": "YOUR_NEW_SCRIPT_ID",
  "rootDir": "."
}
```

### Step 4 — Push Code

```bash
clasp push -f
```

Expected output:
```
Pushed 16 files.
```

### Step 5 — Enable API (If Not Already)

Browser:
```
https://script.google.com/home/usersettings
```
Toggle **ON**.

### Step 6 — Run Setup

**Via browser (recommended):**
```bash
clasp open
```
In Apps Script editor → function dropdown → **`setupProject`** → **▶️ Run** → authorize.

**Or via terminal:**
```bash
clasp run setupProject
```

**Expected log:**
```
➕ Nayi sheet: Clients
➕ Nayi sheet: Services
➕ Nayi sheet: Messages
➕ Nayi sheet: Settings
➕ Nayi sheet: Users
👤 Seeded 2 default users.
⚙️ 17 default settings add hui.
🎨 Headers formatted.
✅ Setup mukammal. Version: 2.1.1
```

### Step 7 — Deploy as Web App

**Via UI (recommended):**

1. `clasp open` → Apps Script editor
2. **Deploy → New deployment**
3. Gear ⚙️ → **Web app**
4. **Description:** `v2.1.1 Initial`
5. **Execute as:** Me
6. **Who has access:** Anyone (or Anyone with Google account)
7. **Deploy** → copy the **Web app URL**

**Or via clasp:**
```bash
clasp deploy --description "v2.1.1 Initial deploy"
```

### Step 8 — First Login

Open the Web App URL in browser.

**Default credentials:**

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin` |
| Normal User | `user` | `user` |

> ⚠️ **Change the admin password immediately** after first login.

### Step 9 — Verify

1. Login as `admin/admin`
2. Dashboard loads with 4 tabs
3. Add a test client
4. Try WhatsApp button
5. Go to **Settings → UI Language** and toggle Roman/English

---

## 📤 Push to GitHub

### Step 1 — Initialize Git

```bash
git init
git branch -M main
```

### Step 2 — Verify `.gitignore`

Create `.gitignore` in root:

```gitignore
# clasp credentials — NEVER commit
.clasprc.json

# Dependencies
node_modules/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# VS Code (keep settings optional)
.vscode/
!.vscode/extensions.json

# Environment
.env
.env.local

# Clasp project config (contains Script ID)
.clasp.json
```

> ⚠️ **Why ignore `.clasprc.json`?** It contains your Google authentication refresh token. Committing it gives anyone access to your Apps Script projects.
>
> ⚠️ **Why ignore `.clasp.json`?** It contains your specific Script ID. If you fork this repo, you don't want to overwrite with someone else's ID.

### Step 3 — Stage & Commit

```bash
git add .
git commit -m "Initial commit: Herbal Master Factory Client Manager v2.1.1"
```

### Step 4 — Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `herbal-master-factory-gas`
3. **Description:** Google Apps Script Client Manager for Herbal Master Factory
4. Choose **Public** or **Private**
5. **Do NOT** initialize with README / .gitignore / license
6. Click **Create repository**

### Step 5 — Connect Local to Remote

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/herbal-master-factory-gas.git
git push -u origin main
```

### Step 6 — Verify

Open: `https://github.com/YOUR_GITHUB_USERNAME/herbal-master-factory-gas`

You should see all files **except** `.clasprc.json`, `.clasp.json`, and `node_modules/`.

---

## 🔄 Daily Development Workflow

### Standard Flow

```bash
# 1. Pull latest from Apps Script
clasp pull

# 2. Make changes in VS Code

# 3. Push to Apps Script
clasp push

# 4. Test in Apps Script editor or Web App
clasp open --webapp

# 5. Commit to Git
git add .
git commit -m "Description of changes"
git push
```

### Watch Mode (Auto-Push on Save)

```bash
clasp push -w
```

Every time you save a file in VS Code, it auto-pushes to Apps Script.

### Create a New Deployment Version

```bash
clasp version "v2.1.2 — Fixed X bug"
clasp deploy <version_number> "Deployment description"
```

Or via UI: **Deploy → Manage deployments → Pencil ✏️ → Version: New version → Deploy**.

### View Logs

```bash
clasp logs
clasp logs --watch      # Live stream
clasp logs --json       # JSON format
```

### Common Commands Reference

| Command | Purpose |
|---------|---------|
| `clasp login` | Authenticate |
| `clasp logout` | Sign out |
| `clasp clone <id>` | Download project |
| `clasp pull` | Download latest |
| `clasp push` | Upload local |
| `clasp push -f` | Force upload (no confirm) |
| `clasp push -w` | Watch mode |
| `clasp status` | Check sync state |
| `clasp open` | Open editor in browser |
| `clasp open --webapp` | Open deployed web app |
| `clasp deploy` | New deployment |
| `clasp deployments` | List deployments |
| `clasp version <desc>` | Create version snapshot |
| `clasp logs` | View execution logs |

---

## 🐛 Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Script API not enabled` | Apps Script API toggle OFF | Enable at https://script.google.com/home/usersettings |
| `User has not enabled the Apps Script API` | Same as above | Same fix; wait 2–3 minutes after toggling |
| `401 Unauthorized` | clasp session expired | `clasp login` again |
| `ENOENT .clasp.json` | Missing config file | Create `.clasp.json` with Script ID |
| `No HTML file named X` | File not pushed | `clasp push -f` |
| `Cannot find module '@google/clasp'` | Not globally installed | `npm install -g @google/clasp` |
| `Permission denied` (rename) | File locked by editor/OneDrive | Close VS Code → rename → reopen |
| `EBUSY` / `EPERM` | OneDrive sync conflict | Move project outside OneDrive (e.g., `C:\Projects\`) |
| `Invalid script ID` | Wrong ID or quotes | Copy ID again — no quotes needed |
| `Command not recognized` (Windows) | URL in terminal | URLs go in browser, not terminal |

### Folder Name With Spaces

If your folder has spaces (`herbal-master-factory gas`), either:

**Option A — Rename:**
```bash
cd ..
mv "herbal-master-factory gas" herbal-master-factory-gas
cd herbal-master-factory-gas
```

**Option B — Use quotes in all commands:**
```bash
cd "herbal-master-factory gas"
```

### OneDrive Issues

If you see `EBUSY`, `EPERM`, or sync errors, move the project outside OneDrive:

```bash
mkdir C:\Projects
mv "C:\Users\sktpa\OneDrive\Desktop\herbal-master-factory gas" "C:\Projects\herbal-master-factory-gas"
cd C:\Projects\herbal-master-factory-gas
```

---

## 🔐 Security Notes

- **Never commit** `.clasprc.json` — contains Google auth refresh tokens
- **`.clasp.json`** can be shared (Script ID only), but usually gitignored for public repos
- **Default credentials** (`admin/admin`, `user/user`) — change immediately after first login
- **Passwords** stored as SHA-256 hashes with per-user salt (not plain text)
- **Session tokens** stored in CacheService (24 hours default, configurable)
- **Failed login attempts** — 5 attempts triggers 15-minute lockout
- **Role-based access** enforced on both frontend (UI) and backend (functions)
- **XSS protection** — all user inputs sanitized before rendering

### Recommended `.gitignore` Rules

```gitignore
# Sensitive
.clasprc.json
.clasp.json
.env
.env.local

# Build artifacts
node_modules/

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

---

## 📊 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1.1 | 2026-10-16 | Fixed responsive bug (client name char-by-char break on mobile) |
| 2.1.0 | 2026-10-16 | Area Size + Unit fields, professional search with Min/Max range, UI Language toggle |
| 2.0.1 | 2026-10-16 | Bilingual WhatsApp templates (Roman + English), 5-option dropdown, service form auto-clear |
| 2.0.0 | 2026-10-15 | Multi-role system, complete rewrite from v1.x |

---

## 🤝 Contributing

This is a private project. For internal development:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test with `clasp push` → `clasp open --webapp`
3. Commit: `git commit -m "Feature: description"`
4. Push: `git push origin feature/your-feature`
5. Open Pull Request on GitHub

---

## 📞 Support

For issues, questions, or feature requests:
- Open a GitHub issue in this repository
- Contact: `YOUR_EMAIL@example.com`

---

## 📄 License

**Private** — Herbal Master Factory. All rights reserved.

This code is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

---

## 🎯 Quick Reference Card

```bash
# Setup (one-time)
clasp login
clasp clone <SCRIPT_ID>

# Daily
clasp pull              # Download latest
clasp push -f           # Upload changes
clasp open              # Open editor
clasp deploy            # Deploy web app

# Git
git add .
git commit -m "message"
git push

# Deploy new version
clasp version "v2.1.2"
clasp deploy <ver> "desc"
```

---

**End of README**