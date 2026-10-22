# Contributing

Before contributing, read [README.md](./README.md) for project scope.

## Setup

Use Node.js 24.22.1 or later to match the action runtime and CI. Earlier Node.js 24 releases are affected by the [October 2026 Node.js security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). Install Git and npm, then run these commands from the repository root:

```sh
npm ci
npm --prefix wrapper ci
```

The action and wrapper have separate dependencies and lockfiles. The root install also configures the Husky Git hooks.

## Tests and build

Run from the repository root:

```sh
npm test
npm run build
```

`npm test` runs the Node.js tests in [tests/setup.test.js](./tests/setup.test.js). They mock installation and command execution, so no StackQL installation or provider credentials are required.

`npm run build` bundles the wrapper into `wrapper/dist/`, then the action into `dist/`. GitHub Actions runs the committed `dist/index.js`, so include updated bundles when changing source or dependencies. Do not edit generated bundles directly.

The [pre-commit hook](./.husky/pre-commit) rebuilds and stages `dist/` and all of `wrapper/`. Review the staged diff before committing.

The [CI workflow](./.github/workflows/setup-stackql-test.yml) runs unit tests and integration checks on Linux, Windows, and macOS for AMD64 and ARM64, with `use_wrapper` enabled and disabled. macOS uses Homebrew and does not install the wrapper.

## Pull requests

- Keep changes scoped to one coherent fix or feature.
- Describe the change and include test results.
- Add or update tests for functional changes, including affected platforms and architectures.
- Update the README and action metadata when changing documented behavior or inputs.
- Include relevant lockfile and generated bundle changes when updating dependencies.

## Security reports

Report suspected vulnerabilities privately using [SECURITY.md](./SECURITY.md).
