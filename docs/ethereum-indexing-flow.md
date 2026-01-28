# Ethereum Logs and Transactions E2E Indexing Flow

This document captures the complete end-to-end flow for indexing Ethereum logs and transactions in the Aleph Indexer Framework.

## High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   FETCHER   │ ──► │   PARSER    │ ──► │   INDEXER   │ ──► │  WORKER DOMAIN  │
│  (RPC calls)│     │ (ABI decode)│     │ (routing)   │     │  (custom hooks) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────────┘
```

Communication between services uses **Moleculer** (microservices framework) with configurable transports (Thread, TCP, NATS).

---

## Phase 1: FETCHER - Raw Data Retrieval

### Key Files
- [packages/ethereum/src/services/fetcher/main.ts](../packages/ethereum/src/services/fetcher/main.ts) - Main EthereumFetcher orchestrator
- [packages/ethereum/src/services/fetcher/factory.ts](../packages/ethereum/src/services/fetcher/factory.ts) - Factory creating all components
- [packages/ethereum/src/sdk/client.ts](../packages/ethereum/src/sdk/client.ts) - RPC client with batch request handling

### Block Indexing (Background Process)
1. **BlockHistoryFetcher** continuously fetches blocks via RPC
   - File: [packages/ethereum/src/services/fetcher/src/block/blockHistoryFetcher.ts](../packages/ethereum/src/services/fetcher/src/block/blockHistoryFetcher.ts)
   - `runForward()` (lines 60-80): Fetches newest blocks
   - `runBackward()` (lines 82-101): Fetches historical blocks

2. **Block Processing** extracts:
   - **Transaction signatures** → `accountTransactionHistoryDAL` via `indexBlockAccountTransactions()` (client.ts:387-413)
   - **Log bloom filters** → `logBloomDAL` via `indexBlockLogBloom()` (client.ts:415-428)

### Transaction History Fetching
- File: [packages/ethereum/src/services/fetcher/src/transaction/transactionHistoryFetcher.ts](../packages/ethereum/src/services/fetcher/src/transaction/transactionHistoryFetcher.ts)
- `EthereumTransactionHistoryFetcher` (lines 22-89)
- Creates per-account fetchers via `EthereumAccountTransactionHistoryFetcher`
- Queries `accountSignatureDAL` by account and block height range

### Log History Fetching
- File: [packages/ethereum/src/services/fetcher/src/log/logHistoryFetcher.ts](../packages/ethereum/src/services/fetcher/src/log/logHistoryFetcher.ts)
- `EthereumLogHistoryFetcher` (lines 26-96)
- Uses **Bloom filters** to efficiently find relevant logs:
  - Queries `logBloomDAL` for block bloom data (client.ts:663-669)
  - Filters using Ethereum Bloom functions (client.ts:680-686)
  - Only calls RPC `getPastLogs` for matching blocks (client.ts:451-477)

### On-Demand Entity Fetching
- **Transaction Fetcher**: [packages/ethereum/src/services/fetcher/src/transaction/transactionFetcher.ts](../packages/ethereum/src/services/fetcher/src/transaction/transactionFetcher.ts)
  - `remoteFetchIds()` calls `ethereumClient.getTransactions()` (batch RPC)
- **Log Fetcher**: [packages/ethereum/src/services/fetcher/src/log/logFetcher.ts](../packages/ethereum/src/services/fetcher/src/log/logFetcher.ts)
  - Checks cache first, then calls `ethereumClient.getLogs()`

### Data Enrichment
- `completeTransactionsWithBlockInfo()` (client.ts:757-793): Adds timestamps
- `completeLogsWithBlockInfo()` (client.ts:795-832): Adds timestamps and generates log IDs
- Log ID format: `${height}_${address}_${logIndex}` (lowercase)

---

## Phase 2: PARSER - ABI Decoding

### Key Files
- [packages/ethereum/src/services/parser/main.ts](../packages/ethereum/src/services/parser/main.ts) - Main parser dispatcher
- [packages/ethereum/src/services/parser/src/transactionParser.ts](../packages/ethereum/src/services/parser/src/transactionParser.ts) - Transaction decoding
- [packages/ethereum/src/services/parser/src/logParser.ts](../packages/ethereum/src/services/parser/src/logParser.ts) - Log decoding
- [packages/ethereum/src/services/parser/src/abiFactory.ts](../packages/ethereum/src/services/parser/src/abiFactory.ts) - ABI caching and retrieval

### Entry Point
- `EthereumParser.parseEntity()` (main.ts:24-34) routes by type:
  - `IndexableEntityType.Transaction` → `EthereumTransactionParser`
  - `IndexableEntityType.Log` → `EthereumLogParser`

### Transaction Parsing
- File: [packages/ethereum/src/services/parser/src/transactionParser.ts](../packages/ethereum/src/services/parser/src/transactionParser.ts)
- `parse()` method (lines 19-34):
  1. Skip if no `to` address (contract creation)
  2. Fetch ABI via `abiFactory.getAbi(rawTx.to)`
  3. Create `ethers.Interface(abi)`
  4. Call `Interface.parseTransaction(data, value)`
  5. Returns `EthereumParsedTransaction` with `parsed: TransactionDescription`

### Log Parsing
- File: [packages/ethereum/src/services/parser/src/logParser.ts](../packages/ethereum/src/services/parser/src/logParser.ts)
- `parse()` method (lines 19-43):
  1. Skip if no `address` field
  2. Fetch ABI (gracefully handle unverified contracts)
  3. Create `ethers.Interface(abi)`
  4. Call `Interface.parseLog(rawLog)`
  5. Returns `EthereumParsedLog` with `parsed: LogDescription`

### ABI Resolution
- File: [packages/ethereum/src/services/parser/src/abiFactory.ts](../packages/ethereum/src/services/parser/src/abiFactory.ts)
- `getAbi()` (lines 20-36):
  1. Check memory cache
  2. Check file cache (`${basePath}/${address}.json`)
  3. Fetch from Etherscan/Blockscout API
  4. Save to cache

### Parsed Data Structures
```typescript
// EthereumParsedTransaction (types.ts:10-11)
type EthereumParsedTransaction = EthereumRawTransaction & {
  parsed?: ethers.utils.TransactionDescription | null
  // TransactionDescription contains: name, args, signature, fragment
}

// EthereumParsedLog (types.ts:15-16)
type EthereumParsedLog = EthereumRawLog & {
  parsed?: ethers.utils.LogDescription | null
  // LogDescription contains: name, args, signature, fragment, eventFragment
}
```

---

## Phase 3: PARSER → INDEXER Communication

### Event Emission (Parser Side)
- File: [packages/framework/src/services/parser/main.ts](../packages/framework/src/services/parser/main.ts)
- `emitParsedEntities()` (lines 86-114):
  1. Groups entities by peer or broadcasts
  2. Emits on multiplexed event channel
  3. Event name format: `parser.ethereum.transaction` or `parser.ethereum.log`

### Event Reception (Indexer Side)
- File: [packages/framework/src/services/indexer/src/entityIndexer.ts](../packages/framework/src/services/indexer/src/entityIndexer.ts)
- `BaseEntityIndexer.start()` (lines 57-60):
  ```typescript
  this.parserClient.on(
    `parser.${this.blockchainId}.${this.type}`,
    this.entityHandler,
  )
  ```

### Moleculer Event Channel
- File: [packages/framework/src/services/common.ts](../packages/framework/src/services/common.ts)
- Uses single multiplexed channel: `MOLECULER_MULTIPLEXED_EVENT_CHANNEL`
- Demultiplexes to specific event listeners (lines 161-163)

---

## Phase 4: INDEXER - Entity Processing

### Key Files
- [packages/framework/src/services/indexer/src/entityIndexer.ts](../packages/framework/src/services/indexer/src/entityIndexer.ts) - Base entity indexer
- [packages/framework/src/services/indexer/src/entityFetcher.ts](../packages/framework/src/services/indexer/src/entityFetcher.ts) - Entity storage/routing
- [packages/framework/src/services/indexer/src/accountEntityIndexer.ts](../packages/framework/src/services/indexer/src/accountEntityIndexer.ts) - Account-based processing

### Entity Reception
- `BaseEntityIndexer.onEntities()` (entityIndexer.ts:124-129):
  ```typescript
  protected async onEntities(chunk: PE[]): Promise<void> {
    await this.entityFetcher.onEntities(chunk)
  }
  ```

### Entity Storage
- `BaseIndexerEntityFetcher.storeIncomingEntities()` (entityFetcher.ts:234-242):
  - Wraps entities as work items with id, time, payload
  - Stores in `PendingWorkPool`

### Entity-to-Request Matching
- `handleIncomingEntities()` (entityFetcher.ts:244-307):
  1. Filter entities by pending requests (account, date range)
  2. Save matching responses
  3. Trigger completion check

### Ethereum-Specific Filtering
- **Transaction Fetcher** ([packages/ethereum/src/services/indexer/src/transactionFetcher.ts](../packages/ethereum/src/services/indexer/src/transactionFetcher.ts):38-82):
  - Filters by date range AND account (from/to address match)
- **Log Fetcher** ([packages/ethereum/src/services/indexer/src/logFetcher.ts](../packages/ethereum/src/services/indexer/src/logFetcher.ts):38-85):
  - Filters by date range AND (contract address OR topic contains account)

### Range Processing
- `BaseAccountEntityIndexer.processRanges()` (accountEntityIndexer.ts:323-375):
  1. Get ranges marked as `Ready`
  2. Retrieve stored entity responses
  3. Call domain handler: `handler.onEntityDateRange({...})`
  4. Mark as `Processed`

---

## Phase 5: WORKER DOMAIN - Custom Hooks

### Key Files
- [packages/ethereum/src/domain/worker.ts](../packages/ethereum/src/domain/worker.ts) - Ethereum worker domain
- [packages/framework/src/utils/domain/indexer/worker.ts](../packages/framework/src/utils/domain/indexer/worker.ts) - Base worker domain

### Entry Point
- `EthereumIndexerWorkerDomain.onEntityDateRange()` (worker.ts:30-42):
  ```typescript
  async onEntityDateRange(response): Promise<void> {
    if (type === IndexableEntityType.Transaction) {
      return this.onTransactionDateRange(response)
    }
    if (type === IndexableEntityType.Log) {
      return this.onLogDateRange(response)
    }
  }
  ```

### Transaction Processing Pipeline
- `onTransactionDateRange()` (worker.ts:44-66):
  ```typescript
  await promisify(pipeline)(
    entities,                                    // StorageValueStream
    new StreamFilter(ethereumFilterTransaction), // Filter hook
    new StreamBuffer(1000),                      // Buffer (configurable)
    new StreamMap(ethereumIndexTransactions),    // Index hook
  )
  ```

### Log Processing Pipeline
- `onLogDateRange()` (worker.ts:68-92):
  ```typescript
  await promisify(pipeline)(
    entities,
    new StreamFilter(ethereumFilterLog),
    new StreamBuffer(1000),
    new StreamMap(ethereumIndexLogs),
  )
  ```

### Hook Name Resolution
- `getBlockchainMethod()` (worker.ts:123-136):
  - Converts kebab-case to camelCase: `ethereum-filter-log` → `ethereumFilterLog`

### Custom Hook Interfaces
```typescript
// Transaction hooks
ethereumFilterTransaction(context: ParserContext, entity: EthereumParsedTransaction): Promise<boolean>
ethereumIndexTransactions(context: ParserContext, entities: EthereumParsedTransaction[]): Promise<void>
ethereumTransactionBufferLength?: number  // default 1000

// Log hooks
ethereumFilterLog(context: ParserContext, entity: EthereumParsedLog): Promise<boolean>
ethereumIndexLogs(context: ParserContext, entities: EthereumParsedLog[]): Promise<void>
ethereumLogBufferLength?: number  // default 1000
```

---

## Complete Data Flow Diagram

```
1. FETCHER
   ├── BlockHistoryFetcher fetches blocks from RPC
   │   ├── indexBlockAccountTransactions() → accountTransactionHistoryDAL
   │   └── indexBlockLogBloom() → logBloomDAL (Bloom filters)
   │
   ├── AccountTransactionHistoryFetcher queries signatures by account/height
   │   └── TransactionFetcher.remoteFetchIds() → RPC batch getTransaction
   │
   └── AccountLogHistoryFetcher uses Bloom filters to find relevant blocks
       └── LogFetcher.remoteFetchIds() → RPC getPastLogs

2. PARSER
   ├── Receives raw entities from fetcher
   ├── AbiFactory.getAbi() → cache or Etherscan/Blockscout API
   ├── ethers.Interface.parseTransaction() or parseLog()
   └── Emits parsed entities: 'parser.ethereum.transaction' / 'parser.ethereum.log'

3. INDEXER
   ├── Subscribes to parser events via Moleculer
   ├── Stores incoming entities in PendingWorkPool
   ├── Matches entities to account requests by date range
   └── Calls domain handler: onEntityDateRange({type, entities, account, ...})

4. WORKER DOMAIN (Custom Implementation)
   ├── Routes by type (Transaction or Log)
   ├── Pipeline: entities → Filter → Buffer → Index
   └── Custom hooks:
       ├── ethereumFilterTransaction / ethereumFilterLog
       └── ethereumIndexTransactions / ethereumIndexLogs
```

---

## Key Configuration

### Environment Variables
- `ETHEREUM_RPC` - RPC endpoint (mandatory)
- `ETHEREUM_EXPLORER_URL` - Etherscan/Blockscout for ABIs (mandatory)
- `ETHEREUM_INDEX_BLOCKS` - Store raw blocks (default: false)
- `ETHEREUM_INDEX_TRANSACTIONS` - Enable transaction indexing (default: true)
- `ETHEREUM_INDEX_LOGS` - Enable log indexing (default: true)

### Account Fetcher Parameters

When configuring accounts for indexing, you can pass `params` to control fetching behavior:

#### Transaction Fetcher Params (`EthereumAccountTransactionHistoryFetcherParams`)
```typescript
{
  iterationLimit?: number       // Max iterations per fetch cycle
  minBlockHeight?: number       // Stop backward fetching at this block (inclusive)
}
```

#### Log Fetcher Params (`EthereumAccountLogHistoryFetcherParams`)
```typescript
{
  contract?: string | '*'       // Filter logs by contract address ('*' = all contracts)
  iterationLimit?: number       // Max iterations per fetch cycle (default: 5000)
  pageLimit?: number            // Max logs per page (default: 5000)
  minBlockHeight?: number       // Stop backward fetching at this block (inclusive)
}
```

#### Example Usage with minBlockHeight
```typescript
// In your MainDomain.discoverAccounts()
accountIndexerConfigs.push({
  blockchainId: BlockchainChain.Ethereum,
  account: '0x1234...',
  meta: { myMeta: 'value' },
  index: {
    transactions: {
      chunkDelay: 0,
      chunkTimeframe: 1000 * 60 * 60 * 24,
      params: {
        minBlockHeight: 15000000,  // Only fetch transactions from block 15M onwards
      },
    },
    logs: {
      chunkDelay: 0,
      chunkTimeframe: 1000 * 60 * 60 * 24,
      params: {
        minBlockHeight: 15000000,  // Only fetch logs from block 15M onwards
        contract: '*',             // Fetch logs from all contracts, not just this address
      },
    },
    state: false,
  },
})
```

### Storage (LevelDB)
- `fetcher_pending_account_transaction_history` - Accounts pending tx fetch
- `fetcher_pending_account_log_history` - Accounts pending log fetch
- Transaction history indexed by: `[account, height, index]`
- Log history indexed by: `[account, height, logIndex]`
- Log bloom filters indexed by: `height`

---

## Example Custom Indexer Implementation

```typescript
// domain/worker.ts
export default class WorkerDomain
  extends IndexerWorkerDomain
  implements EthereumIndexerWorkerDomainI
{
  async ethereumFilterTransaction(
    context: ParserContext,
    entity: EthereumParsedTransaction,
  ): Promise<boolean> {
    // Filter: only process transfer calls
    return entity.parsed?.name === 'transfer'
  }

  async ethereumIndexTransactions(
    context: ParserContext,
    entities: EthereumParsedTransaction[],
  ): Promise<void> {
    // Index: store in custom database
    for (const tx of entities) {
      await this.myStorage.saveTransaction(tx)
    }
  }

  async ethereumFilterLog(
    context: ParserContext,
    entity: EthereumParsedLog,
  ): Promise<boolean> {
    // Filter: only Transfer events
    return entity.parsed?.name === 'Transfer'
  }

  async ethereumIndexLogs(
    context: ParserContext,
    entities: EthereumParsedLog[],
  ): Promise<void> {
    // Index: process Transfer events
    for (const log of entities) {
      const { from, to, value } = log.parsed?.args ?? {}
      await this.myStorage.saveTransfer({ from, to, value })
    }
  }
}
```

---

## Verification

To verify this flow is working:
1. Set `ETHEREUM_RPC` and `ETHEREUM_EXPLORER_URL` in `.env`
2. Run: `npm run start indexer-example`
3. Check console logs for:
   - `📩 entities received by the parser`
   - `✉️ entities sent by the parser`
   - `💌 entities received by the indexer`
   - Custom hook console.log outputs (e.g., "Index ethereum log")
