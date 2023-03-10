import { fileURLToPath } from 'url'
import path from 'path'
import { config } from '@aleph-indexer/core'
import SDK, { Blockchain, TransportType } from '@aleph-indexer/framework'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const workerDomainPath = path.join(__dirname, './src/domain/worker.js')
  const mainDomainPath = path.join(__dirname, './src/domain/main.js')
  const apiSchemaPath = path.join(__dirname, './src/api/index.js')
  const layoutPath = path.join(__dirname, './src/utils/layouts/layout.js')

  const instances = Number(config.INDEXER_INSTANCES || 2)
  const apiPort = Number(config.INDEXER_API_PORT || 8080)
  const tcpUrls = config.INDEXER_TCP_URLS || undefined
  const natsUrl = config.INDEXER_NATS_URL || undefined

  const projectId = 'brick'
  const dataPath = config.INDEXER_DATA_PATH || undefined // 'data'
  const transport =
    (config.INDEXER_TRANSPORT as TransportType) || TransportType.LocalNet

  const transportConfig: any =
    tcpUrls || natsUrl ? { tcpUrls, natsUrl } : undefined

  if (!projectId) throw new Error('INDEXER_NAMESPACE env var must be provided ')

  await SDK.init({
    projectId,
    supportedBlockchains: [Blockchain.Solana],
    transport,
    transportConfig,
    apiPort,
    fetcher: {
      instances: 1,
    },
    parser: {
      instances: 1,
      layoutPath,
    },
    indexer: {
      dataPath,
      main: {
        apiSchemaPath,
        domainPath: mainDomainPath,
      },
      worker: {
        instances,
        domainPath: workerDomainPath,
      },
    },
  })
}

main()
