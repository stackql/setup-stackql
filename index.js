const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require("child_process");
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');

const urls = {
  'linux': 'https://releases.stackql.io/stackql/latest/stackql_linux_amd64.zip',
  // 'darwin': 'https://storage.googleapis.com/stackql-public-releases/latest/stackql_darwin_multiarch.pkg',
  'win32': 'https://releases.stackql.io/stackql/latest/stackql_windows_amd64.zip',
}

// async function downloadCLI(osPlatform){
//   try {

//     core.info(`downloading stackql binary for ${osPlatform}`);
//     const url = urls[osPlatform]
//     core.debug(`binary location: ${url}`);

//     switch (osPlatform) {
//       case 'win32':
//         return await tc.extractZip(await tc.downloadTool(url));
//       case 'darwin':
//         let tmpPath = await tc.downloadTool(url);
//         core.info(`extracting mac pkg in ${tmpPath}...`);
//         const installPath = '/Users/runner/work/_temp/stackql-pkg';
//         execSync(`pkgutil --expand-full ${tmpPath} ${installPath}`);
//         return `${installPath}/Payload`;
//       case 'linux':
//         return await tc.extractZip(await tc.downloadTool(url));
//       default:
//         throw new Error(`Unsupported platform: ${osPlatform}`);
//     }

//   } catch (error) {
//     core.error(error);
//     throw error;
//   }
// }

async function downloadCLI(osPlatform){
  try {

    core.info(`downloading stackql binary for ${osPlatform}`);
    // const url = urls[osPlatform];
    // core.debug(`binary location: ${url}`);

    switch (osPlatform) {
      case 'win32':
        return await tc.extractZip(await tc.downloadTool(urls[osPlatform]));
      case 'darwin':
        core.info(`installing stackql using Homebrew`);
        execSync('brew install stackql', { stdio: 'inherit' });
        // Assuming stackql installs to a standard location accessible in the PATH
        // No need to return a path since brew handles placing it in the PATH
        return '/usr/local/bin'; // or wherever brew installs binaries
      case 'linux':
        return await tc.extractZip(await tc.downloadTool(urls[osPlatform]));
      default:
        throw new Error(`Unsupported platform: ${osPlatform}`);
    }

  } catch (error) {
    core.error(error);
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
    core.debug(`Moving ${source} to ${target}.`);
    await io.mv(source, target);
  } catch (e) {
    core.debug(`Unable to move ${source} to ${target}.`);
    throw e;
  }

  // Install our wrapper as stackql by moving the wrapped executable to stackql
  try {
    source = path.resolve([__dirname, '..', 'wrapper', 'dist', 'index.js'].join(path.sep));
    target = [pathToCLI, 'stackql'].join(path.sep);
    core.debug(`Copying ${source} to ${target}.`);
    await io.cp(source, target);
  } catch (e) {
    core.error(`Unable to copy ${source} to ${target}.`);
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
    core.debug(`updating permissions for ${cliPath}`);
    fs.chmodSync(cliPath, '777');

    core.debug(`adding ${cliPath} to the path`);
    core.addPath(cliPath)

    await makeExecutable(cliPath, osPlatform)

    const wrapper = core.getInput('use_wrapper') === 'true';

    if(wrapper){
      core.info('installing wrapper')
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