import { BlockchainFrameworkImplementation } from '@aleph-indexer/framework'
import { ethereumFetcherClientFactory } from './src/services/fetcher/client.js'
import { ethereumIndexerClientFactory } from './src/services/indexer/client.js'
import { ethereumParserClientFactory } from './src/services/parser/client.js'
import { ethereumFetcherFactory } from './src/services/fetcher/factory.js'
import { ethereumIndexerFactory } from './src/services/indexer/factory.js'
import { ethereumParserFactory } from './src/services/parser/factory.js'
import { ethereumWorkerDomainFactory } from './src/domain/worker.js'

export * from './src/types.js'
export * from './src/domain/index.js'
export * from './src/sdk/index.js'
export * from './src/services/index.js'

// ---

export default {
  fetcher: {
    main: ethereumFetcherFactory,
    client: ethereumFetcherClientFactory,
  },
  parser: {
    main: ethereumParserFactory,
    client: ethereumParserClientFactory,
  },
  indexer: {
    main: ethereumIndexerFactory,
    client: ethereumIndexerClientFactory,
    domain: {
      worker: ethereumWorkerDomainFactory,
      main: null,
    },
  },
} as BlockchainFrameworkImplementation
