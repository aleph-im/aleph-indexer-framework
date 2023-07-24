import { BlockchainFrameworkImplementation } from '@aleph-indexer/framework'
import { oasysFetcherClientFactory } from './src/services/fetcher/client.js'
import { oasysIndexerClientFactory } from './src/services/indexer/client.js'
import { oasysParserClientFactory } from './src/services/parser/client.js'
import { oasysFetcherFactory } from './src/services/fetcher/factory.js'
import { oasysIndexerFactory } from './src/services/indexer/factory.js'
import { oasysParserFactory } from './src/services/parser/factory.js'
import { oasysWorkerDomainFactory } from './src/domain/worker.js'

export * from './src/domain/worker.js'
export * from './src/services/fetcher/index.js'
export * from './src/services/parser/index.js'
export * from './src/services/indexer/index.js'

export default {
  fetcher: {
    main: oasysFetcherFactory,
    client: oasysFetcherClientFactory,
  },
  parser: {
    main: oasysParserFactory,
    client: oasysParserClientFactory,
  },
  indexer: {
    main: oasysIndexerFactory,
    client: oasysIndexerClientFactory,
    domain: {
      worker: oasysWorkerDomainFactory,
      main: null,
    },
  },
} as BlockchainFrameworkImplementation
