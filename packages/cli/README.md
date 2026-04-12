# SpriteStack CLI

[![npm version](https://img.shields.io/npm/v/spritestack.svg)](https://npmjs.org/package/spritestack)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SpriteStack** is the complete TestOps orchestration layer for **TestSprite MCP**. It provides a single CLI (`spritestack`) to run functional, load, and bulk-prompt testing autonomously, generating rich HTML reports and tracking test runs over time.

## Installation

Install globally using npm:

```bash
npm install -g spritestack
```

## Quick Start
1. **Initialize Project:**
   ```bash
   spritestack init
   ```
   This creates a `spritestack.yml` configuration file in your directory.

2. **Run Tests:**
   ```bash
   spritestack run --round 1
   ```
   This kicks off TestSprite MCP. It will run the functional and load tests defined in your YAML file, and generate an HTML report inside the local `testsprite_tests/` folder.

3. **Check Status:**
   ```bash
   spritestack status
   ```
   View a historical table of all your runs and test rounds.

4. **Iterate and Compare:**
   Once you fix the bugs found in Round 1, run Round 2 to see improvement metrics:
   ```bash
   spritestack run --round 2 --compare
   ```

5. **Open Visual Dashboard:**
   ```bash
   spritestack dashboard
   ```
   *Note: This works if you have the full repository cloned. It will launch the local TestOps dashboard at localhost:4242.*

---

## 🤖 Guide for LLMs and AI Agents

SpriteStack is engineered for **autonomous AI workflows**. If you are an AI/LLM, use the following patterns to integrate SpriteStack into your task loops.

### 1. Generating Configuration
Create the `spritestack.yml` file non-interactively using:
```bash
spritestack init -y
```
Or directly write to the file system. Example `spritestack.yml`:
```yaml
name: Project Name
projectType: auto
baseUrl: http://localhost:3000
tests:
  functional:
    journeys: [login, user-flow]
  load:
    users: 50
    duration: 2m
```

### 2. Autonomous Test Verification
To run tests and get a structured, machine-readable JSON result, always use the `--output-json` flag and `--ci` flag. The `--ci` flag will ensure the process exits with code 1 if tests fail, which makes it easy to integrate into continuous agent loops.

```bash
spritestack run all --round 1 --ci --output-json ./test-summary.json
```

**JSON Output Format Example (`test-summary.json`):**
```json
{
  "runId": "abc123d",
  "status": "failed",
  "totalTests": 34,
  "passedTests": 22,
  "failedTests": 12,
  "passRate": "64.7",
  "coveragePercent": "61.0",
  "round": 1,
  "issueCount": 3,
  "reportPath": "/path/to/testsprite_tests/round1/report-abc123d.html"
}
```

### 3. Reviewing Automated Output
After a run, read the `test-summary.json` to extract `failedTests` and the `reportPath`. If failures exist, read the corresponding HTML report located at `reportPath`, explicitly analyze the `[CRITICAL]` and `[HIGH]` issues, fix the code, and re-run with `--round 2 --compare`.

### 4. Viewing Raw Test History
Use the status command to dump the test history table into your shell context:
```bash
spritestack status --limit 5
```

---

## Testing Modalities

### Functional Testing
Defined in `tests.functional`. Specify the key `journeys` you want TestSprite MCP to execute. TestSprite will generate assertions automatically for these features.

### Load Testing
Defined in `tests.load`. Simulates concurrent virtual users (VUs) and flags resource exhaustion, latency spikes, and database pool limits. 
```yaml
tests:
  load:
    users: 100        # Concurrent connections
    duration: 5m      # Sustain load for 5 minutes
    slo:              # Service Level Objectives
      p95: 300ms
      error_rate: 1%
```

### Bulk Prompt Testing (For AI apps)
Defined in `tests.bulkPrompt`. A specific suite designed to test generative AI pipelines under load, tracking LLM latency and cost per 1K requests.
```yaml
tests:
  bulkPrompt:
    enabled: true
    count: 2000
    endpoint: /api/chat
    maxLatency: 5000ms
```

## CLI Reference

- `spritestack init [-y]` (Initialize project config)
- `spritestack run [all|functional|load|bulk-prompt] [--round <n>] [--compare] [--ci] [--output-json <path>]` (Run TestSprite test loop)
- `spritestack status [-n <limit>]` (View a history of all runs)
- `spritestack compare [--r1 <n>] [--r2 <n>]` (Compare metrics between two rounds)
- `spritestack config` (Print current merged configuration)
- `spritestack dashboard [-p <port>]` (Launch graphical TestOps dashboard)

---

**Powered by TestSprite MCP.** Made for the TestSprite S2 Hackathon.
