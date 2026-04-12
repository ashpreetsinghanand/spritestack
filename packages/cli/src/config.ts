import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface FunctionalConfig {
  journeys?: string[];
  baseUrl?: string;
  timeout?: number;
}

export interface SLOConfig {
  p95?: string;
  p99?: string;
  error_rate?: string;
  throughput?: string;
}

export interface LoadConfig {
  profiles?: string[];
  users?: number;
  duration?: string;
  rampUp?: string;
  slo?: SLOConfig;
}

export interface BulkPromptConfig {
  enabled?: boolean;
  count?: number;
  endpoint?: string;
  prompts?: string[];
  maxLatency?: string;
  maxCost?: number;
}

export interface AlertsConfig {
  slack?: string | boolean;
  discord?: string | boolean;
  email?: string;
}

export interface SpritestackConfig {
  name?: string;
  projectType?: 'nextjs' | 'react' | 'express' | 'fastapi' | 'ai-agent' | 'api-heavy' | 'e-commerce' | 'auto';
  baseUrl?: string;
  outputDir?: string;
  tests: {
    functional?: FunctionalConfig;
    load?: LoadConfig;
    bulkPrompt?: BulkPromptConfig;
  };
  alerts?: AlertsConfig;
  continuous?: {
    enabled?: boolean;
    schedule?: string;
  };
}

const DEFAULT_CONFIG: SpritestackConfig = {
  name: 'My Project',
  projectType: 'auto',
  baseUrl: 'http://localhost:3000',
  outputDir: 'testsprite_tests',
  tests: {
    functional: {
      journeys: ['login', 'main-flow'],
      timeout: 30000,
    },
    load: {
      profiles: ['normal-traffic'],
      users: 50,
      duration: '2m',
      rampUp: '30s',
      slo: {
        p95: '300ms',
        error_rate: '1%',
      },
    },
    bulkPrompt: {
      enabled: false,
      count: 100,
      maxLatency: '5000ms',
    },
  },
  alerts: {
    slack: false,
    discord: false,
  },
};

export function loadConfig(cwd: string): SpritestackConfig {
  const configPath = path.join(cwd, 'spritestack.yml');
  if (!fs.existsSync(configPath)) {
    throw new Error(`spritestack.yml not found. Run 'spritestack init' first.`);
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  return yaml.load(raw) as SpritestackConfig;
}

export function writeConfig(cwd: string, config: SpritestackConfig): void {
  const configPath = path.join(cwd, 'spritestack.yml');
  const content = yaml.dump(config, { indent: 2, lineWidth: 120 });
  fs.writeFileSync(configPath, content, 'utf-8');
}

export function getDefaultConfig(): SpritestackConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
