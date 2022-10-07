# Aleph Indexer Framework v0.1

The Aleph Indexer Framework is a high-level abstraction for building multithreaded indexers on Aleph. It is designed to be used by developers who want to build an indexer for a specific Solana program, but don't want to worry about:
- Fetching blocks from the Solana cluster
- Parsing transactions
- Managing the state of the indexer
- Scaling the indexer to multiple threads
- Writing the indexer state to disk
- Reading the indexer state from disk
- Exposing the indexer state over a GraphQL API

## Creating an Indexer
In order to run your own indexer, you need to start by creating a new project:
- either using the [Anchor Indexer Generator](https://github.com/aleph-im/anchor-ts-generator)
- or by using one of the customized indexers in the [indexer library](https://github.com/aleph-im/solana-indexer-library) repository
- or by creating a new project from scratch.

## Running the indexer locally
First, you need to make sure that the framework is running:
```bash
npm run start framework
```
When the services of the framework are ready, you need to run your custom  indexer implementation with
```bash
npm run start your-indexer-name
```

## Running an indexer on Aleph

We have some examples in [this repository](https://github.com/aleph-im/solana-indexer-library) with the concrete steps to deploy an Indexer inside Aleph.im network.

## Architecture
The framework provides three services:

### Fetcher
Each instance tracks accounts of your program and its raw transactions, these accounts are allocated among instances in a balanced manner.
During the execution of the service, the whole process (signatures, pending transactions, raw transactions and accounts information) is stored to create a backup, so that in case it crashes during the process, it can start where it ended before. 
When the signature history of the accounts has been fetched, the service will accept new transaction requests. ie: First fetches pending transactions of the account signatures, then loads new existing requests to the service.
Once a transaction is fetched, it is sent directly to the parser through the communication established between services to perform its function.

### Parser
It receives the raw transactions directly from the fetcher. It is in charge of processing the transactions, splitting them into the instructions that are part of them. Thus, it obtains the raw instructions and the accounts that participate in each of the instructions.

### Indexer
Each instance is an intermediary storage and logging, for backuping the fetcher process, so in case it crashes while processing transactions, it can start where it finished before. Each thread of each indexer instance have a communication channel with the fetchers and parsers instances. All communication between services is done through an event queue for synchronisation between them.
In addition, it knows the fetching state of the transaction history of each account, allowing to know the progress of the process of each one of them.

In order to use these services you need to code some custom implementations: **TODO**

## Environment Variables
Here are some of the more important environment variables that you can set to configure the framework:
```sh
# For specifying a custom solana RPC node
SOLANA_RPC=https://api.mainnet-beta.solana.com
# How much memory to allocate for the indexer
ALEPH_DEFAULT_VM_MEMORY=512 
```
The full list of environment variables can be found in the [.env.defaults](.env.defaults).

## Linting
This project uses eslint + prettier for formatting and linting the code with the default recommended rules.
Additionally, we use [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) for autoconfiguring a `pre-commit` git hook that will run the linter for the `staged files` before making the commit. Everything is automatically setted up after running `npm install`
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
