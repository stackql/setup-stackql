import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';

let importId = 0;

async function runSetup (t, {
  platform = 'win32', arch = 'x64', runnerArch, wrapper = false,
  brewInstalled = true, failAt
} = {}) {
  const savedArch = process.env.RUNNER_ARCH;
  if (runnerArch) process.env.RUNNER_ARCH = runnerArch;
  else delete process.env.RUNNER_ARCH;
  t.after(() => {
    if (savedArch === undefined) delete process.env.RUNNER_ARCH;
    else process.env.RUNNER_ARCH = savedArch;
  });
  const calls = { downloads: [], extracts: [], moves: [], copies: [], paths: [], env: {}, commands: [], chmods: [] };
  const cliPath = path.resolve('fixture cli');
  const fail = stage => { if (failAt === stage) throw new Error(`${stage} failed`); };
  let finish;
  const completed = new Promise(resolve => { finish = resolve; });
  t.mock.module('os', { defaultExport: { platform: () => platform, arch: () => arch } });
  t.mock.module('fs', { defaultExport: {
    chmodSync: (...args) => { calls.chmods.push(args); fail('chmod'); }
  } });
  t.mock.module('child_process', { namedExports: {
    execSync: command => {
      calls.commands.push(command);
      if (command.startsWith('brew ')) fail('brew');
      if (command === 'brew list --formula') return brewInstalled ? 'stackql\n' : '';
      if (command === 'which stackql') return path.join(cliPath, 'stackql');
      if (command.endsWith('--version')) fail('version');
      return 'stackql v0.12.778\n';
    }
  } });
  t.mock.module('@actions/core', { namedExports: {
    info: message => { if (message.startsWith('successfully setup')) finish(); },
    debug: () => {},
    error: () => {},
    setFailed: error => { calls.error = error; finish(); },
    getInput: () => String(wrapper),
    addPath: value => calls.paths.push(value),
    exportVariable: (name, value) => { calls.env[name] = value; }
  } });
  t.mock.module('@actions/tool-cache', { namedExports: {
    downloadTool: async url => { calls.downloads.push(url); fail('download'); return 'fixture-download'; },
    extractZip: async zip => { calls.extracts.push(zip); fail('extract'); return cliPath; }
  } });
  t.mock.module('@actions/io', { namedExports: {
    mv: async (...args) => calls.moves.push(args),
    cp: async (...args) => calls.copies.push(args)
  } });
  await import(`../index.js?test=${importId++}`);
  await completed;
  return { ...calls, cliPath };
}

for (const platform of ['linux', 'win32', 'darwin']) {
  for (const runnerArch of ['X64', 'ARM64']) {
    for (const wrapper of [false, true]) {
      test(`${platform}/${runnerArch}, x64 Node, wrapper=${wrapper}`, { timeout: 5000 }, async t => {
        const calls = await runSetup(t, { platform, runnerArch, wrapper });
        assert.equal(calls.error, undefined);
        const suffix = platform === 'win32' ? '.exe' : '';
        assert.ok(calls.commands.includes(`"${path.join(calls.cliPath, `stackql${suffix}`)}" --version`));

        if (platform === 'darwin') {
          assert.deepEqual(calls.downloads, []);
          assert.ok(calls.commands.includes('brew list --formula'));
          assert.ok(!calls.commands.includes('brew install stackql'));
          assert.deepEqual(calls.moves, []);
          assert.deepEqual(calls.copies, []);
          assert.deepEqual(calls.env, {});
          return;
        }

        const assetOS = platform === 'win32' ? 'windows' : platform;
        const assetArch = runnerArch === 'ARM64' ? 'arm64' : 'amd64';
        assert.deepEqual(calls.downloads, [`https://releases.stackql.io/stackql/latest/stackql_${assetOS}_${assetArch}.zip`]);
        assert.deepEqual(calls.paths, [calls.cliPath]);
        assert.deepEqual(calls.extracts, ['fixture-download.zip']);
        assert.deepEqual(calls.moves[0], ['fixture-download', 'fixture-download.zip']);
        if (platform === 'linux') {
          assert.deepEqual(calls.chmods[1], [path.join(calls.cliPath, 'stackql'), 0o755]);
        }
        if (wrapper) {
          assert.deepEqual(calls.moves[1], [path.join(calls.cliPath, `stackql${suffix}`), path.join(calls.cliPath, `stackql-bin${suffix}`)]);
          assert.equal(calls.copies[0][1], path.join(calls.cliPath, 'stackql'));
          assert.equal(calls.env.STACKQL_CLI_PATH, calls.cliPath);
        } else {
          assert.equal(calls.moves.length, 1);
          assert.deepEqual(calls.copies, []);
          assert.deepEqual(calls.env, {});
        }
      });
    }
  }

  for (const arch of ['x64', 'arm64']) {
    test(`${platform}/${arch} without runner metadata`, { timeout: 5000 }, async t => {
      const calls = await runSetup(t, { platform, arch });
      assert.equal(calls.error, undefined);
      if (platform !== 'darwin') {
        const assetArch = arch === 'x64' ? 'amd64' : 'arm64';
        assert.ok(calls.downloads[0].endsWith(`_${assetArch}.zip`));
      }
    });
  }

  for (const runnerArch of ['ARM', 'IA32']) {
    test(`${platform}/${runnerArch} fails before installation`, { timeout: 5000 }, async t => {
      const calls = await runSetup(t, { platform, runnerArch });
      assert.match(calls.error.message, /unsupported architecture/);
      assert.deepEqual(calls.downloads, []);
      assert.deepEqual(calls.commands, []);
    });
  }
}

test('unsupported platform fails before installation', { timeout: 5000 }, async t => {
  const calls = await runSetup(t, { platform: 'freebsd' });
  assert.match(calls.error.message, /unsupported platform/);
  assert.deepEqual(calls.downloads, []);
  assert.deepEqual(calls.commands, []);
});

test('macOS installs Homebrew formula when absent', { timeout: 5000 }, async t => {
  const calls = await runSetup(t, { platform: 'darwin', brewInstalled: false });
  assert.equal(calls.error, undefined);
  assert.ok(calls.commands.includes('brew install stackql'));
});

for (const failAt of ['download', 'extract', 'chmod', 'version', 'brew']) {
  test(`${failAt} failure fails setup`, { timeout: 5000 }, async t => {
    const platform = failAt === 'brew' ? 'darwin' : 'linux';
    const calls = await runSetup(t, { platform, failAt, wrapper: true });
    assert.ok(calls.error.message.includes(`${failAt} failed`));
    assert.deepEqual(calls.copies, []);
  });
}
