import { BlockchainFrameworkImplementation } from '@aleph-indexer/framework'
import { baseFetcherClientFactory } from './src/services/fetcher/client.js'
import { baseIndexerClientFactory } from './src/services/indexer/client.js'
import { baseParserClientFactory } from './src/services/parser/client.js'
import { baseFetcherFactory } from './src/services/fetcher/factory.js'
import { baseIndexerFactory } from './src/services/indexer/factory.js'
import { baseParserFactory } from './src/services/parser/factory.js'
import { baseWorkerDomainFactory } from './src/domain/worker.js'

export * from './src/domain/worker.js'
export * from './src/services/fetcher/index.js'
export * from './src/services/parser/index.js'
export * from './src/services/indexer/index.js'

export default {
  fetcher: {
    main: baseFetcherFactory,
    client: baseFetcherClientFactory,
  },
  parser: {
    main: baseParserFactory,
    client: baseParserClientFactory,
  },
  indexer: {
    main: baseIndexerFactory,
    client: baseIndexerClientFactory,
    domain: {
      worker: baseWorkerDomainFactory,
      main: null,
    },
  },
} as BlockchainFrameworkImplementation
