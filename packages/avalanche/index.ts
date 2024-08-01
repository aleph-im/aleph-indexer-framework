import { BlockchainFrameworkImplementation } from '@aleph-indexer/framework'
import { avalancheFetcherClientFactory } from './src/services/fetcher/client.js'
import { avalancheIndexerClientFactory } from './src/services/indexer/client.js'
import { avalancheParserClientFactory } from './src/services/parser/client.js'
import { avalancheFetcherFactory } from './src/services/fetcher/factory.js'
import { avalancheIndexerFactory } from './src/services/indexer/factory.js'
import { avalancheParserFactory } from './src/services/parser/factory.js'
import { avalancheWorkerDomainFactory } from './src/domain/worker.js'

export * from './src/domain/worker.js'
export * from './src/services/fetcher/index.js'
export * from './src/services/parser/index.js'
export * from './src/services/indexer/index.js'

export default {
  fetcher: {
    main: avalancheFetcherFactory,
    client: avalancheFetcherClientFactory,
  },
  parser: {
    main: avalancheParserFactory,
    client: avalancheParserClientFactory,
  },
  indexer: {
    main: avalancheIndexerFactory,
    client: avalancheIndexerClientFactory,
    domain: {
      worker: avalancheWorkerDomainFactory,
      main: null,
    },
  },
} as BlockchainFrameworkImplementation
