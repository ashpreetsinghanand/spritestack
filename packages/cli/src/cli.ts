import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { banner, success, info, warn, error as displayError, sectionHeader, formatDuration } from './display';
import { loadConfig, writeConfig, getDefaultConfig, SpritestackConfig } from './config';
import { runTests } from './runner';
import { getRecentRuns } from './db';
import { table } from 'table';

const program = new Command();

program
  .name('spritestack')
  .description('The complete TestOps ecosystem for TestSprite MCP')
  .version('0.1.0');

// ─── INIT ──────────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize SpriteStack in the current project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (opts) => {
    banner();
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'spritestack.yml');

    if (fs.existsSync(configPath) && !opts.yes) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'spritestack.yml already exists. Overwrite?',
        default: false,
      }]);
      if (!overwrite) {
        warn('Initialization cancelled.');
        return;
      }
    }

    let config = getDefaultConfig();

    if (!opts.yes) {
      sectionHeader('Project Setup');

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: path.basename(cwd),
        },
        {
          type: 'list',
          name: 'projectType',
          message: 'Project type:',
          choices: ['nextjs', 'react', 'express', 'fastapi', 'ai-agent', 'api-heavy', 'e-commerce', 'auto'],
          default: 'auto',
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: 'Base URL (local dev server):',
          default: 'http://localhost:3000',
        },
        {
          type: 'input',
          name: 'journeys',
          message: 'Key user journeys to test (comma-separated):',
          default: 'login, checkout, main-flow',
          filter: (v: string) => v.split(',').map((s: string) => s.trim()).filter(Boolean),
        },
        {
          type: 'number',
          name: 'loadUsers',
          message: 'Concurrent users for load testing:',
          default: 50,
        },
        {
          type: 'confirm',
          name: 'bulkPrompt',
          message: 'Enable bulk-prompt testing? (for AI/LLM apps)',
          default: false,
        },
      ]);

      config = {
        ...config,
        name: answers.name,
        projectType: answers.projectType,
        baseUrl: answers.baseUrl,
        tests: {
          ...config.tests,
          functional: { journeys: answers.journeys, timeout: 30000 },
          load: { ...config.tests.load, users: answers.loadUsers },
          bulkPrompt: { ...config.tests.bulkPrompt, enabled: answers.bulkPrompt },
        },
      };
    } else {
      config.name = path.basename(cwd);
    }

    writeConfig(cwd, config);

    // Create necessary folders
    fs.ensureDirSync(path.join(cwd, 'testsprite_tests'));
    fs.ensureDirSync(path.join(cwd, '.spritestack'));

    console.log();
    success(chalk.bold('SpriteStack initialized!'));
    console.log();
    info('Created: ' + chalk.cyan('spritestack.yml'));
    info('Created: ' + chalk.cyan('testsprite_tests/'));
    info('Created: ' + chalk.cyan('.spritestack/'));
    console.log();
    console.log(chalk.dim('Next steps:'));
    console.log(chalk.dim('  1. Start your dev server'));
    console.log(chalk.dim('  2. Run: ') + chalk.cyan('spritestack run --round 1'));
    console.log(chalk.dim('  3. Fix issues found'));
    console.log(chalk.dim('  4. Run: ') + chalk.cyan('spritestack run --round 2'));
    console.log(chalk.dim('  5. Open report: ') + chalk.cyan('spritestack dashboard'));
    console.log();
  });

// ─── RUN ───────────────────────────────────────────────────────────────────
program
  .command('run [testType]')
  .description('Run TestSprite MCP tests (functional | load | bulk-prompt | all)')
  .option('-r, --round <n>', 'Test round number (1, 2, etc.)', '1')
  .option('--compare', 'Compare with previous round')
  .option('--demo', 'Demo mode with simulated results')
  .option('--ci', 'CI mode: exit code 1 on failures')
  .option('--output-json <path>', 'Write JSON result summary to a file (for CI)')
  .action(async (testType = 'all', opts) => {
    banner();
    const cwd = process.cwd();

    let config: SpritestackConfig;
    try {
      config = loadConfig(cwd);
    } catch (e: any) {
      displayError(e.message);
      process.exit(1);
    }

    const round = parseInt(opts.round, 10);
    const type = testType as 'functional' | 'load' | 'bulk-prompt' | 'all';

    // Get previous round for comparison
    let previousRun = undefined;
    if (opts.compare && round > 1) {
      const allRuns = getRecentRuns(cwd, 20);
      previousRun = allRuns.find(r => r.round === round - 1 && r.testType === type);
      if (!previousRun) {
        warn(`No Round ${round - 1} run found for comparison. Run Round ${round - 1} first.`);
      }
    }

    const result = await runTests(config, type, { round, cwd, demoMode: opts.demo }, previousRun);

    // Write JSON summary for CI integrations
    if (opts.outputJson) {
      const jsonSummary = {
        runId: result.run.runId,
        status: result.run.status,
        totalTests: result.run.totalTests,
        passedTests: result.run.passedTests,
        failedTests: result.run.failedTests,
        passRate: result.run.totalTests > 0
          ? ((result.run.passedTests / result.run.totalTests) * 100).toFixed(1)
          : '0.0',
        coveragePercent: result.run.coveragePercent.toFixed(1),
        durationMs: result.run.durationMs,
        round: result.run.round,
        issueCount: result.issues.length,
        reportPath: result.reportPath,
      };
      fs.writeJsonSync(opts.outputJson, jsonSummary, { spaces: 2 });
      info(`JSON summary written to: ${chalk.cyan(opts.outputJson)}`);
    }

    if (opts.ci && result.run.status === 'failed') {
      displayError('Tests FAILED — exiting with code 1 (CI mode)');
      process.exit(1);
    }
  });

// ─── STATUS / HISTORY ──────────────────────────────────────────────────────
program
  .command('status')
  .description('Show recent test runs')
  .option('-n, --limit <n>', 'Number of runs to show', '10')
  .action((opts) => {
    banner();
    const cwd = process.cwd();
    const limit = parseInt(opts.limit, 10);
    const runs = getRecentRuns(cwd, limit);

    if (runs.length === 0) {
      info('No test runs yet. Run: spritestack run');
      return;
    }

    sectionHeader('Recent Test Runs');

    const tableData = [
      [
        chalk.bold('Round'),
        chalk.bold('Type'),
        chalk.bold('Status'),
        chalk.bold('Passed'),
        chalk.bold('Failed'),
        chalk.bold('Coverage'),
        chalk.bold('Duration'),
        chalk.bold('Date'),
      ],
      ...runs.map(r => [
        `R${r.round}`,
        r.testType,
        r.status === 'passed' ? chalk.green('✔ passed') : chalk.red('✖ failed'),
        chalk.green(r.passedTests.toString()),
        r.failedTests > 0 ? chalk.red(r.failedTests.toString()) : chalk.green(r.failedTests.toString()),
        `${r.coveragePercent.toFixed(1)}%`,
        formatDuration(r.durationMs),
        new Date(r.createdAt || '').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      ]),
    ];

    console.log(table(tableData, {
      border: {
        topBody: chalk.dim('-'),
        topJoin: chalk.dim('+'),
        topLeft: chalk.dim('+'),
        topRight: chalk.dim('+'),
        bottomBody: chalk.dim('-'),
        bottomJoin: chalk.dim('+'),
        bottomLeft: chalk.dim('+'),
        bottomRight: chalk.dim('+'),
        bodyLeft: chalk.dim('|'),
        bodyRight: chalk.dim('|'),
        bodyJoin: chalk.dim('|'),
        joinBody: chalk.dim('-'),
        joinLeft: chalk.dim('+'),
        joinRight: chalk.dim('+'),
        joinJoin: chalk.dim('+'),
      },
    }));
  });

// ─── COMPARE ───────────────────────────────────────────────────────────────
program
  .command('compare')
  .description('Compare Round 1 vs Round 2 results')
  .option('--r1 <n>', 'Round 1 number', '1')
  .option('--r2 <n>', 'Round 2 number', '2')
  .action((opts) => {
    banner();
    const cwd = process.cwd();
    const r1 = parseInt(opts.r1, 10);
    const r2 = parseInt(opts.r2, 10);

    const allRuns = getRecentRuns(cwd, 50);
    const run1 = allRuns.find(r => r.round === r1);
    const run2 = allRuns.find(r => r.round === r2);

    if (!run1 || !run2) {
      displayError(`Could not find runs for Round ${r1} and Round ${r2}. Run both rounds first.`);
      return;
    }

    sectionHeader(`Round ${r1} vs Round ${r2} Comparison`);

    const prevRate = run1.totalTests > 0 ? (run1.passedTests / run1.totalTests) * 100 : 0;
    const currRate = run2.totalTests > 0 ? (run2.passedTests / run2.totalTests) * 100 : 0;
    const delta = currRate - prevRate;
    const coverageDelta = run2.coveragePercent - run1.coveragePercent;

    console.log();
    console.log(`  ${chalk.bold('Pass rate')}:  ${chalk.dim(prevRate.toFixed(1) + '%')} → ${chalk.bold(currRate.toFixed(1) + '%')}  ${delta >= 0 ? chalk.green('+' + delta.toFixed(1) + '%') : chalk.red(delta.toFixed(1) + '%')} ${delta >= 0 ? '🟢' : '🔴'}`);
    console.log(`  ${chalk.bold('Coverage')}:   ${chalk.dim(run1.coveragePercent.toFixed(1) + '%')} → ${chalk.bold(run2.coveragePercent.toFixed(1) + '%')}  ${coverageDelta >= 0 ? chalk.green('+' + coverageDelta.toFixed(1) + '%') : chalk.red(coverageDelta.toFixed(1) + '%')}`);
    console.log(`  ${chalk.bold('Passed')}:     ${chalk.dim(run1.passedTests)} → ${chalk.green.bold(run2.passedTests)}`);
    console.log(`  ${chalk.bold('Failed')}:     ${chalk.dim(run1.failedTests)} → ${run2.failedTests <= run1.failedTests ? chalk.green.bold(run2.failedTests) : chalk.red.bold(run2.failedTests)}`);
    console.log();

    if (delta >= 10) {
      success(`Major improvement! TestSprite MCP found and helped fix real issues. 🚀`);
    } else if (delta >= 0) {
      success(`Improved from Round ${r1} to Round ${r2}. Keep iterating!`);
    } else {
      warn(`Round ${r2} is worse than Round ${r1}. Review the issues and fix before re-running.`);
    }
    console.log();
    info(`Tip: Commit the ${chalk.cyan('testsprite_tests/')} folder to your repo for the hackathon submission.`);
  });

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
program
  .command('dashboard')
  .description('Open the SpriteStack dashboard in your browser')
  .option('-p, --port <n>', 'Port to run dashboard on', '4242')
  .action(async (opts) => {
    banner();
    const cwd = process.cwd();
    const port = parseInt(opts.port, 10);

    info('Starting SpriteStack dashboard...');
    const { default: open } = await import('open');

    // Check if dashboard directory exists (monorepo usage)
    const dashboardDir = path.join(__dirname, '../../..', 'dashboard');
    if (fs.existsSync(dashboardDir)) {
      const { spawn } = await import('child_process');
      const node = process.execPath;
      const npmBin = path.join(path.dirname(node), 'npm');
      const child = spawn(
        fs.existsSync(npmBin) ? npmBin : 'npm',
        ['run', 'dev', '--', '--port', port.toString()],
        {
          cwd: dashboardDir,
          stdio: 'inherit',
          env: { ...process.env, SPRITESTACK_CWD: cwd, PORT: port.toString() },
        }
      );
      await sleep(3000);
      await open(`http://localhost:${port}`);
      success(`Dashboard running at ${chalk.cyan(`http://localhost:${port}`)}`);
      await new Promise<void>((resolve, reject) => {
        child.on('close', resolve);
        child.on('error', reject);
      });
    } else {
      // Standalone install: serve from bundled dashboard if present
      info(`Visit ${chalk.cyan('https://github.com/ashpreetsinghanand/spritestack')} to set up the full dashboard.`);
      displayError('Dashboard directory not found. Clone the full repo and run from the project root.');
    }
  });

// ─── CONFIG CHECK ──────────────────────────────────────────────────────────
program
  .command('config')
  .description('View current SpriteStack configuration')
  .action(() => {
    banner();
    const cwd = process.cwd();
    let config: SpritestackConfig;
    try {
      config = loadConfig(cwd);
    } catch (e: any) {
      displayError(e.message);
      return;
    }

    sectionHeader('Current Configuration');
    console.log(chalk.dim(yaml.dump(config, { indent: 2 })));
  });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export { program };
