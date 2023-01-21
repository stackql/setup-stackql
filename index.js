const fs = require('fs').promises;
const os = require('os');
const path = require('path');

// External
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');

const urls = {
    'windows': 'https://releases.stackql.io/stackql/latest/stackql_windows_amd64.zip',
    'ubuntu': 'https://storage.googleapis.com/stackql-public-releases/latest/stackql_darwin_multiarch.pkg',
    'macos': 'https://releases.stackql.io/stackql/latest/stackql_linux_amd64.zip'
}

async function downloadCLI(os){
    try {
        const url = urls[os]
        const pathToCLIZip = await tc.downloadTool(url);
        core.addPath(pathToCLIZip);
    
    } catch (error) {
        core.error(error);
        throw error;
      }
}

async function setup(){
  const platform = core.getInput('running-platform');
  const os = platform.split('-')[0]

  if(!(Object.keys(urls).includes(os))){
    throw Error('Cannot find os name %o', os)
  }
  
  await downloadCLI(os)
}

(async () => {
    try {
      await setup();
    } catch (error) {
      core.setFailed(error.message);
    }
  })();