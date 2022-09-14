# Aleph Indexer Framework v0.1

The Aleph Indexer Framework is a high-level abstraction for building multithreaded indexers on Aleph. It is designed to be used by developers who want to build an indexer for a specific Solana program, but don't want to worry about:
- Fetching blocks from the Solana cluster
- Parsing transactions
- Managing the state of the indexer
- Scaling the indexer to multiple threads
- Writing the indexer state to disk
- Reading the indexer state from disk
- Exposing the indexer state over a GraphQL API

The framework provides three services:

FETCHER: Each instance tracks accounts of your program and its raw transactions, these accounts are allocated among instances in a balanced manner.
During the execution of the service, the whole process (signatures, pending transactions, raw transactions and accounts information) is stored to create a backup, so that in case it crashes during the process, it can start where it ended before. 
When the signature history of the accounts has been fetched, the service will accept new transaction requests. ie: First fetches pending transactions of the account signatures, then loads new existing requests to the service.
Once a transaction is fetched, it is sent directly to the parser through the communication established between services to perform its function.

PARSER: It receives the raw transactions directly from the fetcher. It is in charge of processing the transactions, splitting them into the instructions that are part of them. Thus, it obtains the raw instructions and the accounts that participate in each of the instructions.

INDEXER: Each instance is an intermediary storage and logging, for backuping the fetcher process, so in case it crashes while processing transactions, it can start where it finished before. Each thread of each indexer instance have a communication channel with the fetchers and parsers instances. All communication between services is done through an event queue for synchronisation between them.
In addition, it knows the fetching state of the transaction history of each account, allowing to know the progress of the process of each one of them.

In order to use these services you need to code some custom implementations:

If you have developed your program with Anchor, use your IDL on [Anchor Indexer Generator](https://github.com/aleph-im/anchor-ts-generator) to generate a custom basic implementation of your indexer which works out of the box, based on the Indexer Framework

## Creating an Indexer
In order to run your own indexer, you need to start by creating a new project:
- either using the [Anchor Indexer Generator](https://github.com/aleph-im/anchor-ts-generator)
- or by using one of the examples in the [examples](examples-folder) folder
- or by creating a new project from scratch.

## Running the indexer
First, you need to make sure that the framework is running:
```bash
npm run start framework
```
When the services of the framework are ready, you need to run your custom  indexer implementation with
```bash
npm run start your-indexer-name
```

## TODO

- Improve stats calculation performance caching already processed events for larger time frames. For example if we only configure just one big time frame like "Year" without configuring others smaller than it, we will reprocess all the events in the last year for each new incoming event
- Change all time ranges bounds calculations to [inclusive left bound, exclusive right bound), except for databases in which both bound should be inclusive.
- Allow to pass a custom stats schema to the graphQL base class
- Implement a new option in the stats class for calculating accumulated values in time series
- Implement a broadcasting algorithm for sharing history backups between fetcher instances
- Allow to include custom schemas on the parser, from the development side
