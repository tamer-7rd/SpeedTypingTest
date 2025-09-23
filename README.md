SpeedTypingTest is a web application for measuring typing speed and accuracy. The frontend is built with vanilla JavaScript modules and real-time feedback, while the Flask backend validates every score and maintains a persistent leaderboard.

**Features**
- Three test durations (30 seconds, 60 seconds, 3 minutes) available from the home screen
- Real-time highlighting of correct/incorrect characters plus an audio cue on mistakes
- Backend re-computation of WPM and accuracy to prevent tampering
- Results page with a form to submit runs to the leaderboard
- Leaderboard sorted by score (WPM × Accuracy) and capped at 50 records
- Contact form that emails the administrator via Gmail SMTP

**Tech Stack**
- Backend: `Flask`, `Jinja2`
- Frontend: ES modules (vanilla JS), Bootstrap, custom CSS
- Testing: `pytest` (Python), `vitest` + `jsdom` (JavaScript)
- Code Quality: `flake8` (Python), `ESLint` (JavaScript)
- CI/CD: `GitHub Actions`

**Project Layout**
- `main.py` — Flask entry point and route definitions
- `leaderboard_manager.py` — JSON storage, sorting, duplicate checks for the leaderboard
- `email_sender.py` — Gmail SMTP integration used by the contact form
- `templates/` — Jinja templates (`home.html`, `results.html`, `leaderboard.html`, `learn.html`, `contact.html`, shared `header.html`/`footer.html`)
- `static/js/` — typing logic (`typingTest.js`, `timer.js`, `textRenderer.js`, `audio.js`)
- `static/assets/data.json` — pool of random paragraphs
- `tests/test_app.py` — Flask integration tests
- `static/js/__tests__/` — unit tests for frontend modules
- `.github/workflows/` — GitHub Actions CI/CD configuration (`tests.yml`, `lint.yml`)
- `.flake8` — Python linting configuration
- `.eslintrc.json` — JavaScript linting configuration
- `vitest.config.mjs` — Vitest testing configuration

**Getting Started**
1. Python environment
- Install dependencies: `pip install -r requirements.txt`
- Run the development server: `python main.py`
- The app serves at http://127.0.0.1:5001 by default

2. Node environment (for frontend tests)
- Install packages: `npm install`

**Running Tests**
- Python: `PYTHONPATH=. pytest tests/test_app.py`
- JavaScript: `npm test`
  (Uses Vitest with jsdom.)

**Code Quality & CI/CD**
- **Linting**: 
  - Python: `flake8 .` (configured in `.flake8`)
  - JavaScript: `npm run lint` (ESLint configured in `.eslintrc.json`)
- **GitHub Actions**: Automated testing and linting on every push and PR
  - Tests run on Python 3.11, 3.12, 3.13
  - Both Python (pytest) and JavaScript (vitest) tests executed
  - Code quality checks with flake8 and ESLint
- **Status badges**: Add to your README for build status visibility

**Environment Variables**
Create a `.env` file in the project root for SMTP credentials:

```
EMAIL_BOT=your_bot@gmail.com
EMAIL_BOT_PASSWORD=your_app_password
MY_EMAIL=admin@yourdomain.com
```

Prefer Gmail App Passwords over personal passwords. In production, load secrets from environment managers instead of committing `.env`.

**Backend Routes**
- `/` — home page and entry point for the typing test (`templates/home.html`)
- `/results` — displays a run; validates all metrics using `js_round` and redirects home on mismatch (`main.py`)
- `/leaderboard` — GET shows the table; POST saves a result after computing `coef = wpm * (acc / 100)` (`leaderboard_manager.py`)
- `/contact` — renders/handles the contact form and triggers email delivery (`email_sender.py`)

**Scoring & Validation**
- WPM: `round(((correctChars / 5) / timeSec) * 60)`
- Accuracy: `round(correctChars * 100 / (correctChars + incorrectChars))`
- Backend uses the same JavaScript-style rounding (`js_round`) as the frontend to avoid discrepancies; mismatched submissions are rejected.

**Leaderboard Rules**
- Stored in `instance/leaderboard.json` (created automatically)
- Sorted by `coef` descending, limited to 50 entries (`LeaderboardManager.max_entries`)
- Duplicate runs (same username, wpm, accuracy, coef) are ignored

**Deployment Notes**
- Example command: `gunicorn -w 2 -b 0.0.0.0:5001 main:app`
- Serve and cache static assets under `static/`
- Keep all secrets in environment variables or a secret manager

**Security & Privacy**
- Do not commit real `.env` values; ensure `.gitignore` includes it
- Emails collected via the leaderboard form remain visible only to the administrator

**Key Files**
- `main.py:1`
- `leaderboard_manager.py:1`
- `email_sender.py:1`
- `templates/home.html:1`
- `templates/results.html:1`
- `templates/leaderboard.html:1`
- `static/js/typingTest.js:1`
- `static/js/timer.js:1`
- `static/js/textRenderer.js:1`

**License**
Not specified. Add a `LICENSE` file and reference here if required.
 