import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as io from '@actions/io';

const urls = {
  'linux': {
    'x64': 'https://releases.stackql.io/stackql/latest/stackql_linux_amd64.zip',
    'arm64': 'https://releases.stackql.io/stackql/latest/stackql_linux_arm64.zip',
  },
  'win32': {
    'x64': 'https://releases.stackql.io/stackql/latest/stackql_windows_amd64.zip',
    'arm64': 'https://releases.stackql.io/stackql/latest/stackql_windows_arm64.zip',
  },
};

async function downloadCLI (osPlatform, osArch) {
  try {
    core.info(`preparing to download/install stackql for ${osPlatform}/${osArch}`);

    if (!['linux', 'win32', 'darwin'].includes(osPlatform)) {
      throw new Error(`unsupported platform: ${osPlatform}`);
    }
    if (!['x64', 'arm64'].includes(osArch)) {
      throw new Error(`unsupported architecture: ${osPlatform}/${osArch}`);
    }

    switch (osPlatform) {
      case 'linux':
      case 'win32': {
        const downloadPath = await tc.downloadTool(urls[osPlatform][osArch]);
        const zipPath = `${downloadPath}.zip`;
        await io.mv(downloadPath, zipPath);
        return await tc.extractZip(zipPath);
      }
      case 'darwin':
        // Check if stackql is already installed using brew list --formula
        core.info(`checking if stackql is already installed...`);
        try {
          const installedFormulas = execSync('brew list --formula', { encoding: 'utf-8' });
          if (installedFormulas.includes('stackql')) {
            core.info(`stackql is already installed.`);
            const stackqlPath = execSync('which stackql', { encoding: 'utf-8' }).trim();
            core.debug(`stackql is located at: ${stackqlPath}`);
            return path.dirname(stackqlPath);
          } else {
            core.info(`installing stackql using Homebrew...`);
            execSync('brew install stackql', { stdio: 'inherit' });
          }
        } catch (error) {
          core.info(`error checking/installing stackql: ${error}`);
          throw new Error(`error checking/installing stackql: ${error}`);
        }
        const installedPath = execSync('which stackql', { encoding: 'utf-8' }).trim();
        core.debug(`stackql installed at: ${installedPath}`);
        return path.dirname(installedPath);
    }
  } catch (error) {
    core.error(`failed to install stackql: ${error}`);
    throw error;
  }
}

async function makeExecutable (cliPath, osPlatform) {
  try {
    if (osPlatform === 'win32') {
      return;
    } else {
      core.debug(`making ${cliPath} executable...`);
      fs.chmodSync(path.join(cliPath, 'stackql'), 0o755);
    }
    core.debug(`successfully made ${cliPath} executable`);
  } catch (error) {
    core.error(`Error: ${error.message}`);
    throw error;
  }
}

async function installWrapper (pathToCLI) {
  let source, target;

  // If we're on Windows, then the executable ends with .exe
  const exeSuffix = os.platform().startsWith('win') ? '.exe' : '';

  // Rename stackql(.exe) to stackql-bin(.exe)
  try {
    source = [pathToCLI, `stackql${exeSuffix}`].join(path.sep);
    target = [pathToCLI, `stackql-bin${exeSuffix}`].join(path.sep);
    core.debug(`moving ${source} to ${target}...`);
    await io.mv(source, target);
  } catch (e) {
    core.debug(`unable to move ${source} to ${target}.`);
    throw e;
  }

  // Install our wrapper as stackql by moving the wrapped executable to stackql
  try {
    source = path.resolve([import.meta.dirname, '..', 'wrapper', 'dist', 'index.js'].join(path.sep));
    target = [pathToCLI, 'stackql'].join(path.sep);
    core.debug(`copying ${source} to ${target}...`);
    await io.cp(source, target);
  } catch (e) {
    core.error(`unable to copy ${source} to ${target}.`);
    throw e;
  }

  // Export a new environment variable, so our wrapper can locate the binary
  core.exportVariable('STACKQL_CLI_PATH', pathToCLI);
}

async function setup () {
  try {
    // get runner os
    const osPlatform = os.platform();
    core.debug(`platform: ${osPlatform}`);
    const osArch = (process.env.RUNNER_ARCH || os.arch()).toLowerCase();
    core.debug(`arch: ${osArch}`);

    // download and extract stackql binary
    const cliPath = await downloadCLI(osPlatform, osArch);

    core.debug(`path to cli: ${cliPath}`);

    // set perms and make executable
    if (osPlatform !== 'darwin') {
      core.debug(`updating permissions for ${cliPath}...`);
      fs.chmodSync(cliPath, '777');
      core.debug(`adding ${cliPath} to the path...`);
      core.addPath(cliPath);
      await makeExecutable(cliPath, osPlatform);
    }

    // Print stackql version to action logs
    const exeSuffix = osPlatform === 'win32' ? '.exe' : '';
    const stackqlBin = path.join(cliPath, `stackql${exeSuffix}`);
    core.info('stackql version:');
    const versionOutput = execSync(`"${stackqlBin}" --version`, { encoding: 'utf-8' });
    core.info(versionOutput.trim());

    // Check if wrapper is needed and if it's not Darwin
    const useWrapper = core.getInput('use_wrapper') === 'true';
    if (useWrapper && osPlatform !== 'darwin') {
      core.info('installing wrapper...');
      await installWrapper(cliPath);
    }
    core.info(`successfully setup stackql at ${cliPath}`);
  } catch (e) {
    core.setFailed(e);
  }
}

(async () => {
  try {
    await setup();
  } catch (error) {
    core.setFailed(error.message);
  }
})();
