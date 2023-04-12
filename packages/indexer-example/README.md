# Aleph Indexer Example
This README provides an overview of a simple indexer built using the Aleph Indexer Framework. The example indexer demonstrates the process of indexing transactions, logs, and instructions from multiple blockchains, including

- Ethereum
- Solana
- and Binance Smart Chain (BSC).

The primary purpose of this example is to showcase the functionality of the Aleph Indexer Framework.

## Overview
The indexer is designed to listen for events on supported blockchains and process them according to the specified filtering and indexing logic. In this example, the indexing operations only log the processed data. However, you can easily extend the indexer to store the indexed data in a database or perform more complex processing to meet your project's specific requirements.

## Main Domain
The [`MainDomain`](./src/domain/main.ts) class is responsible for *account discovery*. It returns a list of accounts to be indexed for each supported blockchain. This class extends the [`IndexerMainDomain`](../framework/src/utils/domain/indexer/main.ts) from the Aleph Indexer Framework and implements the `IndexerMainDomainWithDiscovery` interface.

### Account Discovery
The `discoverAccounts` function in the `MainDomain` class returns an array of `AccountIndexerConfigWithMeta` objects, containing the blockchain ID, account address, meta information, and indexing configuration for each supported blockchain.

### Stats Calculation
The `IndexerMainDomainWithStats` interface extends the capabilities of the `MainDomain` class by introducing methods for calculating and retrieving statistics about indexed accounts on supported blockchains. By implementing this interface, the main domain can update, retrieve, and transform time-series stats for specified accounts, as well as obtain global stats for those accounts.

An stub example can be found here: [Stats Calculation](./src/domain/_mainWithStats.ts)


## Worker Domain
The WorkerDomain class implements the filtering and indexing logic for transactions, logs, and instructions on each supported blockchain. This class extends the IndexerWorkerDomain from the Aleph Indexer Framework and implements the interfaces for Ethereum, Solana, and BSC indexer worker domains.

### Filtering
The WorkerDomain class contains filtering functions for transactions, logs, and instructions on each supported blockchain. In this example, all transactions, logs, and instructions are allowed to pass through the filters.

### Indexing
The WorkerDomain class contains indexing functions for transactions, logs, and instructions on each supported blockchain. In this example, the indexing functions only log the processed data, but you can extend the functionality to store the data in a database or perform additional processing.

## Getting Started
To start using this example indexer, follow these steps:

- Clone the repository and install dependencies.
- Configure the environment variables according to the Aleph Indexer Framework documentation.
- Run the indexer using the provided scripts in the package.json file.

With these steps, you'll have a fully functional indexer that demonstrates the capabilities of the Aleph Indexer Framework. Customize the filtering and indexing logic or extend the functionality to fit your specific project requirements.