import { createWorkers, WorkerKind } from '@aleph-indexer/framework/dist/src/utils/workers.js'
import { getMoleculerBroker } from '@aleph-indexer/framework/dist/src/utils/moleculer/config.js'
import { TransportType } from '@aleph-indexer/framework'

const indexers = [
    {
        projectId: 'pyth',
        transport: 'LocalNet',
        transportConfig: undefined,
        dataPath: 'data',
        supportedBlockchains: [ 'solana' ],
        kind: WorkerKind.Indexer,
        name: 'pyth-indexer-0',
        domainPath: '/Users/riki/Developer/aleph-indexer-framework/packages/pyth/dist/src/domain/worker.js'
    }
]
const parsers = [
    {
        projectId: 'pyth',
        transport: 'LocalNet',
        transportConfig: undefined,
        dataPath: 'data',
        supportedBlockchains: [ 'solana' ],
        kind: WorkerKind.Parser,
        name: 'pyth-parser-0',
        layoutPath: '/Users/riki/Developer/aleph-indexer-framework/packages/pyth/dist/src/layouts/layout.js'
    }
]
const fetchers = [
    {
        projectId: 'pyth',
        transport: 'LocalNet',
        transportConfig: undefined,
        dataPath: 'data',
        supportedBlockchains: [ 'solana' ],
        kind: WorkerKind.Fetcher,
        name: 'pyth-fetcher-0'
    }
]
const mains = [{ kind: WorkerKind.Main, name: 'pyth-indexer-main' }]

const allLocalChannels = createWorkers([
    ...fetchers,
    ...parsers,
    ...indexers,
    ...mains,
])

export const localBroker = getMoleculerBroker('pyth-indexer-0', TransportType.Thread, {
    channels: allLocalChannels['pyth-indexer-0'],
})