# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Aleph Indexer Framework is a high-level abstraction for building multithreaded blockchain indexers on Aleph. It's a TypeScript monorepo managed with Lerna and npm workspaces that supports multiple blockchains (Solana, Ethereum, BSC, Oasys, Base, Avalanche).

## Common Commands

```bash
# Install dependencies (also runs build automatically via postinstall)
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Lint
npm run lint

# Lint and auto-fix
npm run lint:fix

# Run the framework locally
npm run start framework

# Run a specific indexer
npm run start <indexer-name>

# Check for circular dependencies
npm run deps:fix

# Generate documentation
npm run docs

# Release new version (uses lerna)
npm run version
```

## Architecture

### Monorepo Structure

The repo contains these packages in `packages/`:
- **core**: Base utilities - storage (LevelDB), GraphQL API server, rate limiting, configuration
- **framework**: Main SDK and three core services (Fetcher, Parser, Indexer) with Moleculer for inter-service communication
- **ethereum**, **solana**, **bsc**, **oasys**, **oasys-verse**, **base**, **avalanche**: Blockchain-specific implementations
- **indexer-example**: Reference implementation showing how to build a custom indexer

### Three-Service Architecture

All services communicate via Moleculer (microservices framework) using configurable transports (Thread, TCP, NATS):

1. **Fetcher** (`packages/framework/src/services/fetcher/`): Tracks accounts and fetches raw transactions. Stores backup state for crash recovery. Sends raw data to Parser.

2. **Parser** (`packages/framework/src/services/parser/`): Receives raw transactions from Fetcher, splits them into instructions, extracts participating accounts.

3. **Indexer** (`packages/framework/src/services/indexer/`): Intermediary storage for backup. Maintains communication channels with Fetchers and Parsers via event queues. Tracks fetching progress per account.

### Building a Custom Indexer

Developers extend the framework by implementing:
- **MainDomain** (extends `IndexerMainDomain`): Singleton that discovers accounts to index via `discoverAccounts()` method
- **WorkerDomain** (extends `IndexerWorkerDomain`): Implements blockchain-specific filter/index hooks like `ethereumFilterLog()`, `ethereumIndexLogs()`, `solanaIndexInstructions()`, etc.
- **APISchema**: GraphQL schema for exposing indexed data

Entry point is via the SDK:
```typescript
import sdk from '@aleph-indexer/framework'
await sdk.init({
  projectId: 'my-indexer',
  supportedBlockchains: ['ethereum', 'solana'],
  indexer: {
    worker: { domainPath: './domain/worker.js' },
    main: { domainPath: './domain/main.js', apiSchemaPath: './api/schema.js' }
  },
  fetcher: { instances: 1 },
  parser: { instances: 1 }
})
```

### Key Configuration

Environment variables (see `.env.defaults`):
- `INDEXER_FRAMEWORK_NAMESPACE`: Namespace for service names
- `INDEXER_FRAMEWORK_BLOCKCHAINS`: Comma-separated list of supported blockchains
- `INDEXER_FRAMEWORK_DATA_PATH`: Storage directory for indexed data
- `SOLANA_RPC`, `ETHEREUM_RPC`, etc.: RPC endpoints (mandatory per blockchain)
- `NODE_OPTIONS=--max-old-space-size=16384`: Default 16GB heap for Node.js

### Technology Stack

- TypeScript with ES modules (`"type": "module"`)
- Moleculer for microservice communication
- LevelDB for storage
- GraphQL for APIs
- Jest for testing
- ESLint + Prettier with husky pre-commit hooks

## Ethereum Indexing Flow (Detailed)

> **Full documentation**: See [docs/ethereum-indexing-flow.md](docs/ethereum-indexing-flow.md) for comprehensive details with file paths and line numbers.

### E2E Data Flow
```
FETCHER → PARSER → INDEXER → WORKER DOMAIN
```

### Phase 1: Fetcher (Raw Data Retrieval)
- **BlockHistoryFetcher** (`packages/ethereum/src/services/fetcher/src/block/`) continuously fetches blocks
- Extracts transaction signatures → `accountTransactionHistoryDAL`
- Extracts log bloom filters → `logBloomDAL` (for efficient log filtering)
- **EthereumClient** (`packages/ethereum/src/sdk/client.ts`) handles RPC batch requests

### Phase 2: Parser (ABI Decoding)
- **EthereumParser** (`packages/ethereum/src/services/parser/main.ts`) routes by entity type
- **AbiFactory** (`packages/ethereum/src/services/parser/src/abiFactory.ts`) caches ABIs from Etherscan/Blockscout
- Uses `ethers.Interface` to decode transactions and logs
- Emits events: `parser.ethereum.transaction` / `parser.ethereum.log`

### Phase 3: Indexer (Entity Processing)
- Subscribes to parser events via Moleculer (`packages/framework/src/services/indexer/src/entityIndexer.ts`)
- Stores entities in `PendingWorkPool`, matches to account requests
- **Ethereum-specific filtering**:
  - Transactions: filters by from/to address match
  - Logs: filters by contract address OR topic containing account

### Phase 4: Worker Domain (Custom Hooks)
- **EthereumIndexerWorkerDomain** (`packages/ethereum/src/domain/worker.ts`) routes to processing pipelines
- Pipeline: `entities → StreamFilter → StreamBuffer(1000) → StreamMap`
- **Custom hook interfaces**:
  ```typescript
  ethereumFilterTransaction(context, entity): Promise<boolean>
  ethereumIndexTransactions(context, entities[]): Promise<void>
  ethereumFilterLog(context, entity): Promise<boolean>
  ethereumIndexLogs(context, entities[]): Promise<void>
  ```

### Key Ethereum Configuration
- `ETHEREUM_RPC` - RPC endpoint (mandatory)
- `ETHEREUM_EXPLORER_URL` - For ABI fetching (mandatory)
- `ETHEREUM_INDEX_TRANSACTIONS` - Enable tx indexing (default: true)
- `ETHEREUM_INDEX_LOGS` - Enable log indexing (default: true)

### Account Fetcher Params (minBlockHeight)
Use `params.minBlockHeight` in account config to limit backward fetching to a specific block:
```typescript
// In MainDomain.discoverAccounts()
{
  blockchainId: 'ethereum',
  account: '0x...',
  index: {
    logs: { params: { minBlockHeight: 15000000 } },      // Stop at block 15M
    transactions: { params: { minBlockHeight: 15000000 } },
  }
}
```
