import { fileURLToPath } from 'url'
import path from 'path'
import { Blockchain, config } from '@aleph-indexer/core'
import SDK, { TransportType } from '@aleph-indexer/framework'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const workerDomainPath = path.join(__dirname, './src/domain/worker.js')
  const mainDomainPath = path.join(__dirname, './src/domain/main.js')
  const apiSchemaPath = path.join(__dirname, './src/api/index.js')

  const instances = Number(config.INDEXER_INSTANCES || 2)
  const apiPort = Number(config.INDEXER_API_PORT || 8081)
  const tcpUrls = config.INDEXER_TCP_URLS || undefined
  const natsUrl = config.INDEXER_NATS_URL || undefined

  const projectId = config.INDEXER_NAMESPACE || 'example'
  const supportedBlockchains = (
    config.INDEXER_FRAMEWORK_BLOCKCHAINS || 'ethereum'
  ).split(',') as Blockchain[]
  const dataPath = config.INDEXER_DATA_PATH || undefined // 'data'
  const transport =
    (config.INDEXER_TRANSPORT as TransportType) || TransportType.LocalNet

  const transportConfig: any =
    tcpUrls || natsUrl ? { tcpUrls, natsUrl } : undefined

  if (!projectId) throw new Error('INDEXER_NAMESPACE env var must be provided')

  await SDK.init({
    projectId,
    supportedBlockchains,
    transport,
    transportConfig,
    apiPort,
    // fetcher: {
    //   dataPath,
    //   instances: 1,
    // },
    // parser: {
    //   dataPath,
    //   instances: 1,
    // },
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
