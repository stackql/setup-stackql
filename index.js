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

        console.log('path to CLI Zip is %o', pathToCLIZip)

        let pathToCLI = '';
  
        pathToCLI = await tc.extractZip(pathToCLIZip);

        fs.chmodSync(pathToCLI, '755');

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