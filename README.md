[![Setup StackQL](https://github.com/stackql/setup-stackql/actions/workflows/setup-stackql-test.yml/badge.svg)](https://github.com/stackql/setup-stackql/actions/workflows/setup-stackql-test.yml)  

# setup-stackql

The `stackql/setup-stackql` action is a JavaScript action that sets up StackQL CLI in your GitHub Actions workflow by downloading a latest Stackql CLI and adding it to the `PATH`.

This action can be run on `ubuntu-latest`, `windows-latest`, and `macos-latest` GitHub Actions runners, and will install and expose the latest version of the `stackql` CLI on the runner environment.  

## Usage
Authentication to StackQL providers is done via environment variables source from GitHub Actions Secrets.  To learn more about authentication, see the setup instructions for your provider or providers at the [StackQL Provider Registry Docs](https://stackql.io/registry).

## Examples
The following example demonstrate the use of the `stackql/setup-stackql` action in a GitHub Actions workflow, demonstrating how to use the action to install the `stackql` CLI and then use it to execute a StackQL query.

### GitHub Example
Check the "Use GitHub Provider" step in [setup-stackql-test.yml](.github/workflows/setup-stackql-test.yml) for the working example, for more information on the GitHub provider for StackQL, see the [GitHub Provider Docs](https://registry.stackql.io/github).

```yaml
    - name: setup StackQL
      uses: stackql/setup-stackql@v2.2.3
      with:
        use_wrapper: true

    - name: Use GitHub Provider
      run: |
        stackql exec -i ./examples/github-example.iql
      env: 
        STACKQL_GITHUB_USERNAME: ${{  secrets.STACKQL_GITHUB_USERNAME }}
        STACKQL_GITHUB_PASSWORD: ${{  secrets.STACKQL_GITHUB_PASSWORD }}
```

### Google Example
Check the "Use Google Provider" step in [setup-stackql-test.yml](.github/workflows/setup-stackql-test.yml) for the working example, for more information on the Google provider for StackQL, see the [Google Provider Docs](https://registry.stackql.io/google).

```yaml
    - name: setup StackQL
      uses: stackql/setup-stackql@v2.2.3
      with:
        use_wrapper: true

    - name: Use Google Provider
      run: | 
        stackql exec -i ./examples/google-example.iql
      env: 
        GOOGLE_CREDENTIALS : ${{  secrets.GOOGLE_CREDENTIALS  }}
```

## Inputs
- __`use_wrapper`__ - (optional) Whether to install a wrapper to wrap subsequent calls of
   the `stackql` binary and expose its STDOUT, STDERR, and exit code as outputs
   named `stdout`, `stderr`, and `exitcode` respectively. Defaults to `false`.

## Outputs
This action does not configure any outputs directly. However, when you set the `use_wrapper` input
to `true`, the following outputs are available for subsequent steps that call the `stackql` binary:

- __`stdout`__ - The STDOUT stream of the call to the `stackql` binary.
- __`stderr`__ - The STDERR stream of the call to the `stackql` binary.
- __`exitcode`__ - The exit code of the call to the `stackql` binary.
