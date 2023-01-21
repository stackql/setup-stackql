const fs = require('fs');
const os = require('os');
const path = require('path');

// External
const io = require('@actions/io');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');



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

async function setup(){

  const path = await downloadCLI()

  core.addPath(path)

}

(async () => {
    try {
      await setup();
    } catch (error) {
      core.setFailed(error.message);
    }
  })();