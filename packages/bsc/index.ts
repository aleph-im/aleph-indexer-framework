import { BlockchainFrameworkImplementation } from '@aleph-indexer/framework'
import { bscFetcherClientFactory } from './src/services/fetcher/client.js'
import { bscIndexerClientFactory } from './src/services/indexer/client.js'
import { bscParserClientFactory } from './src/services/parser/client.js'
import { bscFetcherFactory } from './src/services/fetcher/factory.js'
import { bscIndexerFactory } from './src/services/indexer/factory.js'
import { bscParserFactory } from './src/services/parser/factory.js'
import { bscWorkerDomainFactory } from './src/domain/worker.js'

export * from './src/domain/worker.js'
export * from './src/types.js'

export * from './src/services/fetcher/index.js'
export * from './src/services/parser/index.js'
export * from './src/services/indexer/index.js'

export default {
  fetcher: {
    main: bscFetcherFactory,
    client: bscFetcherClientFactory,
  },
  parser: {
    main: bscParserFactory,
    client: bscParserClientFactory,
  },
  indexer: {
    main: bscIndexerFactory,
    client: bscIndexerClientFactory,
    domain: {
      worker: bscWorkerDomainFactory,
      main: null,
    },
  },
} as BlockchainFrameworkImplementation
