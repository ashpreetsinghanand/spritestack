import chalk from 'chalk';
import boxen from 'boxen';

const SPRITE_BLUE = '#4F6EF7';

export const banner = () => {
  const title = chalk.hex(SPRITE_BLUE).bold('SpriteStack');
  const subtitle = chalk.gray('The complete TestOps ecosystem for TestSprite MCP');
  const version = chalk.dim('v0.1.0');

  console.log(
    boxen(`${title}  ${version}\n${subtitle}`, {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      margin: { top: 1, bottom: 0, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'blue',
    })
  );
  console.log();
};

export const success = (msg: string) => console.log(chalk.green('✔'), msg);
export const info = (msg: string) => console.log(chalk.blue('ℹ'), msg);
export const warn = (msg: string) => console.log(chalk.yellow('⚠'), msg);
export const error = (msg: string) => console.log(chalk.red('✖'), msg);
export const dim = (msg: string) => console.log(chalk.dim(msg));

export const sectionHeader = (title: string) => {
  console.log();
  console.log(chalk.hex(SPRITE_BLUE).bold(`▸ ${title}`));
  console.log(chalk.dim('─'.repeat(50)));
};

export const statusBadge = (status: string): string => {
  const map: Record<string, string> = {
    passed: chalk.bgGreen.black(' PASS '),
    failed: chalk.bgRed.white(' FAIL '),
    running: chalk.bgBlue.white(' RUN  '),
    error: chalk.bgMagenta.white(' ERR  '),
  };
  return map[status] || chalk.bgGray.white(` ${status.toUpperCase()} `);
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

export const formatPercent = (n: number): string => {
  const color = n >= 80 ? chalk.green : n >= 50 ? chalk.yellow : chalk.red;
  return color(`${n.toFixed(1)}%`);
};
