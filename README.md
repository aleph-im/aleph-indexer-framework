# Start Here!

There are two crucial repos you should be aware of:
1. Aleph indexer framework: (You're here already!) Consisting of the main building blocks that the indexer library needs to create an indexer. Changes made in the framework will reflect all future indexers. If you want to contribute to the framework, you're in the correct repo. If you want to create your indexer, head to point two of this section.
2. [Solana indexer library](https://github.com/aleph-im/solana-indexer-library): This is where you need to start if you want to create your own solana indexer.

You can find low-level documentation here: https://aleph-im.github.io/aleph-indexer-framework/

## Aleph Indexer Framework v1.0

The Aleph Indexer Framework is a high-level abstraction for building multithreaded indexers on Aleph. It is designed to be used by developers who want to build an indexer for a specific Solana program, but don't want to worry about:
- Fetching blocks from the Solana cluster
- Parsing transactions
- Managing the state of the indexer
- Scaling the indexer to multiple threads
- Writing the indexer state to disk
- Reading the indexer state from disk
- Exposing the indexer state over a GraphQL API

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

## Running the indexer framework locally

1. Create a .env file on the root folder for including configuration variables of the framework. Take a look at "Environment Variables" section in this document

2. Depending on the blockchains that you need to index, you may need to install additional peer dependencies packages:
```bash
  # In case you want to index ethereum
  npm i @aleph-indexer/ethereum

  # In case you want to index solana
  npm i @aleph-indexer/solana
```

3. After that, you need to make sure that the framework is running:
```bash
  npm run start framework
```

4. When the services of the framework are ready, you need to run your custom  indexer implementation with
```bash
  npm run start your-indexer-name
```

## Environment Variables
Here are some of the more important environment variables that you can set to configure the framework:
```sh
# Framework specific config

# A namespace for the framework services names (default "global")
INDEXER_FRAMEWORK_NAMESPACE

# List of blockchains that the framework will support (default "solana,ethereum")
INDEXER_FRAMEWORK_BLOCKCHAINS

# Path to a folder where all the indexed data will be stored
INDEXER_FRAMEWORK_DATA_PATH

# Ethereum specific envs

# To specify a custom ethereum RPC node (*mandatory*)
ETHEREUM_RPC

# Custom etherscan url to get contract abis (*mandatory*)
ETHEREUM_EXPLORER_URL

# Feature flag for storing blocks in cache (default "false") 
ETHEREUM_INDEX_BLOCKS

# Solana specific envs

# For specifying a custom solana RPC node/cluster without rate limits (*mandatory*)
SOLANA_RPC

# For specifying a main public solana RPC node/cluster rate limited 
# that guarantees historical data access (default "https://api.mainnet-beta.solana.com")
SOLANA_HISTORIC_RPC

# Other configuration vars

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
