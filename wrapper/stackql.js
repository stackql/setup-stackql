#!/usr/bin/env node
const io = require('@actions/io');
const core = require('@actions/core');
const { exec } = require('@actions/exec');

const OutputListener = require('./lib/output-listener');
const pathToCLI = require('./lib/stackql-bin');

async function checkStackQL () {
  // Setting check to `true` will cause `which` to throw if stackql isn't found
  const check = true;
  return io.which(pathToCLI, check);
}

(async () => {
  // This will fail if StackQL isn't found, which is what we want
  await checkStackQL();

  // Create listeners to receive output (in memory) as well
  const stdout = new OutputListener();
  const stderr = new OutputListener();
  const listeners = {
    stdout: stdout.listener,
    stderr: stderr.listener
  };

  // Execute stackql and capture output
  const args = process.argv.slice(2);
  const options = {
    listeners,
    ignoreReturnCode: true
  };
  const exitCode = await exec(pathToCLI, args, options);
  core.debug(`StackQL exited with code ${exitCode}.`);
  core.debug(`stdout: ${stdout.contents}`);
  console.log(`stderr: ${stderr.contents}`);
  core.debug(`exitcode: ${exitCode}`);

  // Set outputs, result, exitcode, and stderr
  core.setOutput('stdout', stdout.contents);
  core.setOutput('stderr', stderr.contents);
  core.setOutput('exitcode', exitCode.toString(10));

  if ((exitCode === 0 || exitCode === 2) && !stderr.contents) {
    // A exitCode of 0 is considered a success
    // An exitCode of 2 may be returned when the '-detailed-exitcode' option
    // is passed to plan. This denotes Success with non-empty
    // diff (changes present).
    return;
  }

  // A non-zero exitCode is considered an error
  core.setFailed(`StackQL exited with error ${stderr.contents}.`);
})();
