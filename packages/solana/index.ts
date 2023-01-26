import { BlockchainFrameworkImplementation } from '@aleph-indexer/framework'
import { solanaFetcherClientFactory } from './src/services/fetcher/client.js'
import { solanaIndexerClientFactory } from './src/services/indexer/client.js'
import { solanaParserClientFactory } from './src/services/parser/client.js'
import { solanaFetcherFactory } from './src/services/fetcher/factory.js'
import { solanaIndexerFactory } from './src/services/indexer/factory.js'
import { solanaParserFactory } from './src/services/parser/factory.js'
import { solanaWorkerDomainFactory } from './src/domain/worker.js'

export * from './src/domain/worker.js'
export * from './src/types.js'
export * from './src/utils/index.js'

export * from './src/services/fetcher/index.js'
export * from './src/services/parser/index.js'
export * from './src/services/indexer/index.js'

export default {
  fetcher: {
    main: solanaFetcherFactory,
    client: solanaFetcherClientFactory,
  },
  parser: {
    main: solanaParserFactory,
    client: solanaParserClientFactory,
  },
  indexer: {
    main: solanaIndexerFactory,
    client: solanaIndexerClientFactory,
    domain: {
      worker: solanaWorkerDomainFactory,
      main: null,
    },
  },
} as BlockchainFrameworkImplementation
