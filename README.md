# setup-stackql

The `stackql/setup-stackql` action is a JavaScript action that sets up Terraform CLI in your GitHub Actions workflow by:

- Downloading a latest Stackql CLI and adding it to the `PATH`.
- Setup AUTH env var in the Github Action

# Auth
[Learn more](https://stackql.io/docs/getting-started/authenticating) about authentication setup when running stackql

### Basic Example
1. Set Auth variable, for example:
```
{ "github": { "type": "basic", "credentialsenvvar": "STACKQL_GITHUB_CREDS" } }
```
2. create the github token as a secret
3. In the execution step, pass the secret as environment variable with name "STACKQL_GITHUB_CREDS"

Check the "Use GitHub Provider" step in `.github/workflows/example-workflows.yml` for the working example

### json File Auth example

1. Set Auth variable, for example:
```
{ "google": { "type": "service_account",  "credentialsfilepath": "sa-key.json" }}
```
2. encode the key json file into base64 string
3. in execution step, run `sudo echo ${{ secrets.<name of the secret> }} | base64 -d > sa-key.json`

Check the "Use Google Provider" step in `.github/workflows/example-workflows.yml` for the working example