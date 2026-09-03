import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Read the active project id from .firebaserc so the deploy target is never hardcoded. */
const resolveProjectId = () => {
  try {
    const rc = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'));
    const id = rc?.projects?.default;
    if (!id) throw new Error('projects.default missing in .firebaserc');
    return id;
  } catch (error) {
    console.error(`Could not resolve project id from .firebaserc: ${error.message}`);
    process.exit(1);
  }
};

const projectId = resolveProjectId();

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  return result.status ?? 1;
};

const buildStatus = run('npm', ['run', 'build']);
if (buildStatus !== 0) process.exit(buildStatus);

const stampStatus = run('node', ['scripts/stamp-dist.mjs']);
if (stampStatus !== 0) process.exit(stampStatus);

const deploy = spawnSync(
  'firebase',
  ['deploy', '--only', 'hosting', '--project', projectId, '--non-interactive'],
  { encoding: 'utf8' },
);

const output = `${deploy.stdout ?? ''}${deploy.stderr ?? ''}`;

if (deploy.status === 0) {
  console.log('\nDeploy complete.');
  process.exit(0);
}

const alreadyLive = output.includes('is the current active version');
if (alreadyLive) {
  console.log('\nDeploy finished: Firebase reports this build is already live.');
  console.log('Site: https://dronehub.ge');
  process.exit(0);
}

process.stderr.write(output);
process.exit(deploy.status ?? 1);
