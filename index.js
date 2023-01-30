const fs = require('fs');
const os = require('os');
const path = require('path');

// External
const io = require('@actions/io');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const { execSync } = require("child_process");


const urls = {
    'ubuntu': 'https://releases.stackql.io/stackql/latest/stackql_linux_amd64.zip',
}

async function downloadCLI(){
    try {
        const url = urls['ubuntu']
        const pathToCLIZip = await tc.downloadTool(url);

        let pathToCLI = '';
  
        pathToCLI = await tc.extractZip(pathToCLIZip);

        fs.chmodSync(pathToCLI, '777')

        core.info(`Stackql CLI path is ${pathToCLI}.`);

        return pathToCLI      
    
    } catch (error) {
        core.error(error);
        throw error;
      }
}

async function addPermission(){
  try {
    execSync("find ~ -name stackql -exec chmod +x {} \\;");
    console.log("Successfully gave execute permission to stackql");
  } catch (error) {
    console.error(`Error: ${error.message}`);
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


async function setup(){

  const osPlatform = os.platform();
  const osArch = os.arch();

  const path = await downloadCLI()

  core.addPath(path)
  await addPermission()
  const wrapper = core.getInput('use_wrapper') === 'true';
  if(wrapper){
    console.log(`Platform: ${osPlatform}`);
    console.log(`Arch: ${osArch}`);
    console.log('installing wrapper')
    await installWrapper(path)
  }
}

(async () => {
    try {
      await setup();
    } catch (error) {
      core.setFailed(error.message);
    }
  })();