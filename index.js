const fs = require('fs').promises;
const os = require('os');
const path = require('path');

// External
const tc = require('@actions/tool-cache');
const io = require('@actions/io');
const core = require('@actions/core');


const urls = {
    'windows': 'https://releases.stackql.io/stackql/latest/stackql_windows_amd64.zip',
    'ubuntu': 'https://storage.googleapis.com/stackql-public-releases/latest/stackql_darwin_multiarch.pkg',
    'macos': 'https://releases.stackql.io/stackql/latest/stackql_linux_amd64.zip'
}

async function downloadCLI(){
    try {
      const osName = os.platform().split('-')[0]
    
      if(!(Object.keys(urls).includes(osName))){
        throw Error('Cannot find os name %o', osName)
      }
    
        const url = urls[osName]
        const pathToCLIZip = await tc.downloadTool(url);

        let pathToCLI = '';
        if (os.platform().startsWith('win')) {
          core.debug(`Stackql CLI Download Path is ${pathToCLIZip}`);
          const fixedPathToCLIZip = `${pathToCLIZip}.zip`;
          io.mv(pathToCLIZip, fixedPathToCLIZip);
          core.debug(`Moved download to ${fixedPathToCLIZip}`);
          pathToCLI = await tc.extractZip(fixedPathToCLIZip);
        } else {
          pathToCLI = await tc.extractZip(pathToCLIZip);
        }
        core.addPath(pathToCLI);
      
    
    } catch (error) {
        core.error(error);
        throw error;
      }
}

async function setup(){

  await downloadCLI(os)
}

(async () => {
    try {
      await setup();
    } catch (error) {
      core.setFailed(error.message);
    }
  })();