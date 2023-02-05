import { BlockchainFrameworkImplementation } from '@aleph-indexer/framework'
import { ethereumFetcherClientFactory } from './src/services/fetcher/client.js'
import { ethereumIndexerClientFactory } from './src/services/indexer/client.js'
import { ethereumParserClientFactory } from './src/services/parser/client.js'
import { ethereumFetcherFactory } from './src/services/fetcher/factory.js'
import { ethereumIndexerFactory } from './src/services/indexer/factory.js'
import { bscParserFactory } from './src/services/parser/factory.js'
import { ethereumWorkerDomainFactory } from './src/domain/worker.js'

export * from './src/domain/worker.js'
export * from './src/types.js'

export * from './src/services/fetcher/index.js'
export * from './src/services/parser/index.js'
export * from './src/services/indexer/index.js'

export default {
  fetcher: {
    main: ethereumFetcherFactory,
    client: ethereumFetcherClientFactory,
  },
  parser: {
    main: bscParserFactory,
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
