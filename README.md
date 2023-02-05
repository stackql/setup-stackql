[![Setup StackQL](https://github.com/stackql/setup-stackql/actions/workflows/setup-stackql.yml/badge.svg)](https://github.com/stackql/setup-stackql/actions/workflows/setup-stackql.yml)  

# setup-stackql

The `stackql/setup-stackql` action is a JavaScript action that sets up StackQL CLI in your GitHub Actions workflow by:

- Downloading a latest Stackql CLI and adding it to the `PATH`.
- Setup AUTH env var in the Github Action

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners, and will install and expose the latest version of the `stackql` CLI on the runner environment.  

# Usage
[Learn more](https://stackql.io/docs/getting-started/authenticating) about authentication setup when running stackql

## Basic Example
1. Set Auth variable, for example:
```
{ "github": { "type": "basic", "credentialsenvvar": "STACKQL_GITHUB_CREDS" } }
```
2. create the github token as a secret
3. In the execution step, pass the secret as environment variable with name "STACKQL_GITHUB_CREDS"

Check the "Use GitHub Provider" step in [setup-stackql.yml](.github/workflows/setup-stackql.yml) for the working example

### Example
```
    - name: Use GitHub Provider
      run: |
        stackql exec -i ./examples/github-example.iql --auth='{ "github": { "type": "basic", "credentialsenvvar": "STACKQL_GITHUB_CREDS" } }'
      env: 
        STACKQL_GITHUB_CREDS: ${{  secrets.STACKQL_GITHUB_CREDS }}
```


## json File Auth example

1. Set Auth variable, for example:
```
{ "google": { "type": "service_account",  "credentialsfilepath": "sa-key.json" }}
```
2. encode the key json file into base64 string
3. in execution step, run `sudo echo ${{ secrets.<name of the secret> }} | base64 -d > sa-key.json`

Check the "Prep Google Creds" step in [setup-stackql.yml](.github/workflows/setup-stackql.yml) for the working example

### Example
```
  - name: Prep Google Creds (bash)
      if: ${{ matrix.os != 'windows-latest' }}
      run: | ## use the secret to create json file
        sudo echo ${{ secrets.GOOGLE_CREDS }} | base64 -d > sa-key.json

    - name: Use Google Provider
      run: | 
        stackql exec -i ./examples/google-example.iql --auth='{ "google": { "type": "service_account",  "credentialsfilepath": "sa-key.json" }}'
```

## Input
- `use_wrapper` - (optional) Whether to install a wrapper to wrap subsequent calls of
   the `stackql` binary and expose its STDOUT, STDERR, and exit code as outputs
   named `stdout`, `stderr`, and `exitcode` respectively. Defaults to `false`.

## Outputs
This action does not configure any outputs directly. However, when you set the `use_wrapper` input
to `true`, the following outputs are available for subsequent steps that call the `stackql` binary:

- `stdout` - The STDOUT stream of the call to the `stackql` binary.
- `stderr` - The STDERR stream of the call to the `stackql` binary.
- `exitcode` - The exit code of the call to the `stackql` binary.
