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

async function setupAuth(){
  /**
   * AUTH='{ "google": { "credentialsfilepath": "creds/stackql-demo.json",  "type": "service_account" }, 
   * "okta": { "credentialsenvvar": "OKTA_SECRET_KEY", "type": "api_key", credentials: '<your credentials>' }}'
   */
  /**
   * expected auth obj
   * {
   * okta :{
   * type: "api_key",
   * credentialsenvvar: 'OKTA_SECRET_KEY',
   * credentials: '<the credential>'
   * }
   * }
   */

  /**
   * When credentials envvar exist, set a env var in the action
   * key = <value of credentialsenvvar in auth obj>
   * value = <value of credentials in auth obj>
   */
  const authObjString = core.getInput("authObjString");
  try {
    const authObj = JSON.parse(authObjString)
    Object.keys(authObj).forEach(providerName =>{
      const providerAuth = authObj[providerName]
      if (providerAuth.credentialsenvvar && providerAuth.credentials) {
        core.exportVariable(providerAuth.credentialsenvvar, providerAuth.credentials)
        delete authObj[providerName]['credentials']
      }
      //TODO: if provider auth is a file  
    })

    const stackqlAuthString = JSON.stringify(authObj)
    core.info('Setting AUTH string %o', stackqlAuthString)
    core.exportVariable('AUTH', stackqlAuthString)
    
  } catch (error) {
      throw Error(`Error when setup auth ${error}`)
  }

}

async function setup(){

  const path = await downloadCLI()

  core.addPath(path)
  await addPermission()
  setupAuth()
}

(async () => {
    try {
      await setup();
    } catch (error) {
      core.setFailed(error.message);
    }
  })();