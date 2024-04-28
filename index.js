const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require("child_process");
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');

const urls = {
  'linux': 'https://releases.stackql.io/stackql/latest/stackql_linux_amd64.zip',
  'win32': 'https://releases.stackql.io/stackql/latest/stackql_windows_amd64.zip',
}

async function downloadCLI(osPlatform) {
  try {
    core.info(`preparing to download/install stackql for ${osPlatform}`);

    switch (osPlatform) {
      case 'win32':
        return await tc.extractZip(await tc.downloadTool(urls[osPlatform]));
        case 'darwin':
          // Check if stackql is already installed using brew list --formula
          core.info(`checking if stackql is already installed...`);
          try {
            const installedFormulas = execSync('brew list --formula', { encoding: 'utf-8' });
            if (installedFormulas.includes('stackql')) {
              core.info(`stackql is already installed.`);
              const stackqlPath = execSync('which stackql', { encoding: 'utf-8' }).trim();
              core.debug(`stackql is located at: ${stackqlPath}`);
              return path.dirname(stackqlPath); // Return the directory of the binary
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
          return path.dirname(installedPath); // Return the directory of the binary
      case 'linux':
        return await tc.extractZip(await tc.downloadTool(urls[osPlatform]));
      default:
        throw new Error(`unsupported platform: ${osPlatform}`);
    }
  } catch (error) {
    core.error(`failed to install stackql: ${error}`);
    throw error;
  }
}

async function makeExecutable(cliPath, osPlatform){
  try {
    if(osPlatform === 'win32'){
      return;
    } else {
      core.debug(`making ${cliPath} executable...`);      
      execSync(`chmod +x ${cliPath}/stackql`);
    }
    core.debug(`successfully made ${cliPath} executable`);
  } catch (error) {
    core.error(`Error: ${error.message}`);
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
    source = path.resolve([__dirname, '..', 'wrapper', 'dist', 'index.js'].join(path.sep));
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


async function setup() {
  try {

    // get runner os
    const osPlatform = os.platform(); 
    core.debug(`platform: ${osPlatform}`);
    const osArch = os.arch();
    core.debug(`arch: ${osArch}`);

    // download and extract stackql binary
    const cliPath = await downloadCLI(osPlatform)
    
    core.debug(`path to cli: ${cliPath}`);

    // set perms and make executable
    if(osPlatform != 'darwin'){
      core.debug(`updating permissions for ${cliPath}...`);
      fs.chmodSync(cliPath, '777');
      core.debug(`adding ${cliPath} to the path...`);
      core.addPath(cliPath)
      await makeExecutable(cliPath, osPlatform)
    }

    const wrapper = core.getInput('use_wrapper') === 'true';

    if(wrapper){
      core.info('installing wrapper...')
      await installWrapper(cliPath)
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