# setup-stackql

The `stackql/setup-stackql` action is a JavaScript action that sets up Terraform CLI in your GitHub Actions workflow by:

- Downloading a latest Stackql CLI and adding it to the `PATH`.
- Setup AUTH env var in the Github Action

## Auth object string
Example
```
{   
    "google": { "credentialsfilepath": "creds/stackql-demo.json",  "type": "service_account" }, 
    "okta": { "credentialsenvvar": "OKTA_SECRET_KEY", "type": "api_key", credentials: '<your credentials>' }
}
```

