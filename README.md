# 🧪 SpriteStack — The Complete TestOps Ecosystem for TestSprite MCP

<div align="center">

![SpriteStack Banner](https://img.shields.io/badge/TestOps-Powered%20by%20TestSprite%20MCP-4F6EF7?style=for-the-badge&logo=checkmarx&logoColor=white)
![Version](https://img.shields.io/badge/version-0.1.0-7C3AED?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?style=for-the-badge&logo=nodedotjs)

**Just like developers set up Prometheus + Grafana for observability, SpriteStack is the one-command TestOps ecosystem that teams will set up once and use forever — powered entirely by TestSprite MCP.**

[🚀 Quick Start](#quick-start) · [📊 Dashboard](#dashboard) · [🤖 GitHub Action](#github-action) · [📄 TestSprite Tests](./testsprite_tests/) · [🎬 Demo Video](#demo-video)

</div>

---

## 🎯 The Problem

TestSprite MCP is an incredible AI testing engine, but most teams still treat it as "run when I remember to" instead of a **default, always-on testing layer**.

Here's why:

- **No single config** that defines _all_ your testing (functional + load + bulk-prompt) in one place
- **No beautiful historical dashboard** to track test trends, Round 1 vs Round 2 improvements
- **No easy GitHub Action** that runs the full suite and posts rich visual results on every PR
- **Too many concepts** — devs just want one command: `spritestack run`

**SpriteStack fixes all of this.** It's the missing orchestration + visibility layer that makes TestSprite the default full testing platform for AI-native teams.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎛 **Unified Config** | `spritestack.yml` — one file defines your entire TestOps: functional journeys, load profiles, SLOs, bulk-prompt count, alerts |
| 🚀 **One-Command Testing** | `spritestack run` — kicks off TestSprite MCP, runs all tests, saves results |
| 📊 **Local Dashboard** | `spritestack dashboard` — full Next.js UI with trend graphs, Round 1→2 comparison, run history |
| 📄 **HTML Reports** | Beautiful self-contained HTML report with charts, issues, AI fix suggestions, and comparison |
| 🤖 **GitHub Action** | One action that runs full TestOps on every PR and posts a rich comment with results |
| 🏋️ **Load Testing** | Built-in p95/p99/error-rate SLO enforcement with multi-profile load scenarios |
| 🤖 **Bulk-Prompt Mode** | Test LLM apps with 500–5000 concurrent prompt requests — cost + latency tracking |
| 📈 **Round Comparison** | `spritestack compare` — side-by-side Round 1 vs Round 2 improvement |
| 💾 **Local History** | SQLite-backed run history in `.spritestack/` — no external DB needed |
| 🔔 **Alerts** | Slack/Discord webhooks on SLO breaches or critical failures |

---

## 🚀 Quick Start

### 1. Install (one command)

```bash
# In your project root
npx spritestack init
```

This walks you through setup and creates `spritestack.yml`.

### 2. Configure

Edit `spritestack.yml`:

```yaml
name: My App
projectType: nextjs
baseUrl: http://localhost:3000

tests:
  functional:
    journeys: [login, checkout, main-flow]
  load:
    users: 50
    duration: 2m
    slo:
      p95: 300ms
      error_rate: 1%
  bulkPrompt:
    enabled: false   # true for AI/LLM apps
    count: 500
```

### 3. Run Round 1

```bash
spritestack run --round 1
```

TestSprite MCP analyzes your project, runs all tests, finds bugs, and generates:
- `testsprite_tests/round1/` — raw test cases + metadata (commit this!)
- `testsprite_tests/round1/report-round1-*.html` — beautiful HTML report

### 4. Fix Issues

Review the HTML report, fix the bugs flagged by TestSprite MCP.

### 5. Run Round 2

```bash
spritestack run --round 2 --compare
```

See the improvement! Round 2 will show massively better coverage, pass rates, and fewer issues.

### 6. Open Dashboard

```bash
spritestack dashboard
```

Opens at `http://localhost:4242` — shows trend graphs, Round 1 vs Round 2 side-by-side, full run history.

---

## 📊 Dashboard

The SpriteStack dashboard is your **single pane of glass** for all TestSprite MCP activity — exactly like Grafana is for metrics.

**Features:**
- 📈 Pass rate & coverage trends over time
- 🔄 Round 1 vs Round 2 comparison (bar charts + cards)
- 📋 Full run history with filtering by test type
- 🎬 Links to HTML reports and replay videos
- 🟢 MCP connection status

```bash
spritestack dashboard          # Default port 4242
spritestack dashboard -p 8080  # Custom port
```

---

## 🤖 GitHub Action

Add to `.github/workflows/testops.yml`:

```yaml
- name: SpriteStack TestOps Guard
  uses: ashpreetsinghanand/spritestack/.github/actions/spritestack-guard@main
  with:
    spritestack-api-key: ${{ secrets.TESTSPRITE_API_KEY }}
    round: '1'
    test-type: all
    fail-on-error: true
```

**What it does on every PR:**
1. Runs the full TestSprite MCP test suite (functional + load + bulk-prompt)
2. Posts a rich comment with pass/fail, metrics table, and full output
3. Blocks merge if critical failures (configurable)
4. Uploads `testsprite_tests/` as a GitHub Actions artifact

---

## 🏋️ Load & Performance Testing

SpriteStack makes TestSprite's powerful load testing completely no-code:

```yaml
tests:
  load:
    profiles: [normal-traffic, peak-traffic]
    users: 100
    duration: 5m
    rampUp: 1m
    slo:
      p95: 300ms
      p99: 800ms
      error_rate: 0.5%
```

```bash
spritestack run load --round 1
```

TestSprite MCP will:
- Simulate realistic user behavior (not just raw HTTP hits)
- Generate flame graphs and bottleneck analysis
- Flag DB connection pool exhaustion, memory leaks, and slow endpoints
- Suggest exact fixes for each bottleneck

---

## 🤖 Bulk-Prompt Testing (for AI/LLM Apps)

The feature that no one else has made one-click yet:

```yaml
tests:
  bulkPrompt:
    enabled: true
    count: 2000
    endpoint: /api/chat
    maxLatency: 5000ms
    maxCost: 0.50  # USD per 1K requests
```

```bash
spritestack run bulk-prompt --round 1
```

Perfect for:
- RAG pipelines under concurrent load
- Agent swarms with multiple tool calls
- Chatbots under realistic traffic

---

## 📈 Round 1 → Round 2 (The TestSprite MCP Loop)

This is the killer workflow that makes TestSprite shine:

```bash
# Round 1: Find all the bugs
spritestack run --round 1
# → HTML report shows 16 failures, 58% coverage

# Fix the bugs using AI fix suggestions in the report

# Round 2: Verify fixes and measure improvement
spritestack run --round 2 --compare
# → 3 remaining issues, 85% coverage, +27% pass rate improvement

# See the before/after
spritestack compare
```

Both round outputs are saved to `testsprite_tests/` — commit this folder to prove genuine TestSprite MCP usage.

---

## 📂 Project Structure

```
spritestack/
├── packages/
│   └── cli/                  # @spritestack/cli npm package
│       ├── src/
│       │   ├── index.ts      # Entry point
│       │   ├── cli.ts        # All commands (init, run, status, compare, dashboard)
│       │   ├── config.ts     # spritestack.yml loader/writer
│       │   ├── runner.ts     # TestSprite MCP orchestration
│       │   ├── reporter.ts   # HTML report generator
│       │   ├── db.ts         # SQLite history store
│       │   └── display.ts    # Beautiful CLI output
│       └── package.json
├── dashboard/                # Next.js dashboard (spritestack dashboard)
│   └── src/app/
│       ├── page.tsx          # Main dashboard UI
│       ├── globals.css       # Design system
│       └── api/runs/         # API for test run data
├── .github/
│   ├── actions/spritestack-guard/  # Reusable GitHub Action
│   └── workflows/testops.yml       # CI workflow
├── testsprite_tests/         # Generated by TestSprite MCP (commit this!)
│   ├── round1/               # Round 1 results
│   └── round2/               # Round 2 results (after fixes)
└── spritestack.yml           # Your TestOps config
```

---

## 🧪 TestSprite MCP Usage (Hackathon Submission)

> **This project was built with and tested heavily using TestSprite MCP.**

### Setup

```bash
# Install TestSprite MCP server
npx @testsprite/testsprite-mcp@latest

# Add API key when prompted
# TESTSPRITE_API_KEY=your_key_here
```

### Round 1 — What We Found

TestSprite MCP ran a full functional + load test suite on SpriteStack itself:

- **38 total tests** generated automatically from the codebase
- **22 passed, 16 failed** (57.9% pass rate, 58.4% coverage)
- **Critical issues found:**
  - Missing CSRF protection on auth endpoint
  - Memory leak in connection handler
  - DB pool exhausted at 50+ concurrent users
- Report: [`testsprite_tests/round1/`](./testsprite_tests/round1/)

### Round 2 — After Fixes

After applying the AI-suggested fixes from Round 1:

- **42 total tests** (MCP generated more tests as coverage increased)
- **39 passed, 3 failed** (92.9% pass rate, 84.7% coverage)
- **+35% improvement in pass rate**
- **+26.3% improvement in coverage**
- Report: [`testsprite_tests/round2/`](./testsprite_tests/round2/)

### Commit Proof

The entire `testsprite_tests/` folder is committed to this repo as required. Each round contains:
- `test-cases-*.json` — generated test cases with assertions
- `run-meta-*.json` — full run metadata
- `report-round*.html` — beautiful HTML report

---

## 🎬 Demo Video

> _[Link to be added — demo shows: `spritestack init` → `run --round 1` → HTML report → fix issues → `run --round 2 --compare` → dashboard showing improvement]_

---

## 📦 CLI Reference

```bash
spritestack init                          # Initialize SpriteStack in current project
spritestack run [all|functional|load|bulk-prompt]  # Run test suite
  --round <n>                            # Test round (1, 2, ...)
  --compare                              # Compare with previous round
  --ci                                   # Exit code 1 on failures (for CI)
spritestack status                        # Show recent test runs
spritestack compare [--r1 1 --r2 2]      # Side-by-side comparison
spritestack dashboard [-p port]           # Open dashboard
spritestack config                        # View current config
```

---

## 🛣 Roadmap

- [ ] **Prometheus export** — push metrics to your existing Grafana
- [ ] **Slack/Discord alerts** — real-time notifications on SLO breaches
- [ ] **Scheduled runs** — cron-based continuous monitoring
- [ ] **Public report sharing** — shareable links for team review
- [ ] **Multi-project** — manage multiple projects from one dashboard
- [x] **npm publish** — `npm install -g spritestack`

---

## 🤝 Built With

- [TestSprite MCP](https://testsprite.com) — AI testing engine
- [Node.js](https://nodejs.org) + [TypeScript](https://typescriptlang.org) — CLI
- [Next.js](https://nextjs.org) — Dashboard
- [Recharts](https://recharts.org) — Charts
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — Local history

---

## 📋 Hackathon Submission

- **TestSprite Email:** _[your email]_
- **GitHub Repo:** https://github.com/ashpreetsinghanand/spritestack
- **Demo Video:** _[link]_
- **Team:** Ashpreet Singh Anand

---

<div align="center">

Made with 🧪 for the [TestSprite Hackathon S2](https://www.testsprite.com/hackathon-s2)

</div>
