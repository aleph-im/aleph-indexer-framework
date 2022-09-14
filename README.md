# GraphQL solana test VM

``` sh
# install dependencies
npm i

# Run an indexer
./run.sh raydium

# upload to the aleph.im network (you need to have aleph-client installed)
ALEPH_DEFAULT_VM_MEMORY=512 python3 -m aleph_client program . run.sh

# When it asks for a rootfs, use this one:
d22a9915e9d8e5e82f660511129c6f25fb26cd303ce70a6f62d318b09855c98f
```

## Environment vars

```sh
# For specifying a custom solana RPC node
SOLANA_RPC=https://api.mainnet-beta.solana.com

## Lint and format

This projects uses eslint + prettier for formating and linting the code with the default recommended rules.
Additionally we use [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) for autoconfiguring a `pre-commit` git hook that will run the linter for the `staged files` before making the commit. Everything is automatically setted up after running `npm install`
If you are using vscode, install the eslint extension and modify this values in your IDE config for this project to make it work properly:

```json
{
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.formatOnSave": false
  },
  "[typescriptreact]": {
    "editor.formatOnSave": false
  },
  "[javascript]": {
    "editor.formatOnSave": false
  },
  "[javascriptreact]": {
    "editor.formatOnSave": false
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
