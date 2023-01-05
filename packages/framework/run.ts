import SDK, { TransportType } from './index.js'

async function main() {
  const services = (
    process.env['INDEXER_FRAMEWORK_SERVICES'] || 'fetcher,parser'
  ).split(',')
  const instances = Number(process.env['INDEXER_FRAMEWORK_INSTANCES'] || 1)
  const apiPort = Number(process.env['INDEXER_FRAMEWORK_API_PORT'] || 8080)
  const tcpUrls = process.env['INDEXER_FRAMEWORK_TCP_URLS'] || undefined
  const natsUrl = process.env['INDEXER_FRAMEWORK_NATS_URL'] || undefined
  const projectId = process.env['INDEXER_FRAMEWORK_NAMESPACE'] || 'global'
  const supportedBlockchains = (
    process.env['INDEXER_FRAMEWORK_BLOCKCHAINS'] || 'solana,ethereum'
  ).split(',')

  const instanceOffset = Number(
    process.env['INDEXER_FRAMEWORK_INSTANCE_OFFSET'] || 0,
  )
  const dataPath = process.env['INDEXER_FRAMEWORK_DATA_PATH'] || undefined // 'data'
  const transport =
    (process.env['INDEXER_FRAMEWORK_TRANSPORT'] as TransportType) ||
    TransportType.LocalNet

  if (!TransportType[transport])
    throw new Error(`Invalid transport type ${transport}`)

  const transportConfig = tcpUrls || natsUrl ? { tcpUrls, natsUrl } : undefined

  let config: any = {
    projectId,
    supportedBlockchains,
    transport,
    transportConfig,
    apiPort,
  }

  for (const command of services) {
    switch (command) {
      case 'fetcher': {
        console.log(
          `Initializing ${projectId} "${command}" using ${transport} transport`,
        )

        config = {
          ...config,
          fetcher: {
            instances,
            instanceOffset,
            dataPath,
            api: true,
          },
        }

        break
      }
      case 'parser': {
        console.log(
          `Initializing ${projectId} "${command}" using ${transport} transport`,
        )

        config = {
          ...config,
          parser: {
            instances,
            instanceOffset,
            dataPath,
            api: true,
          },
        }

        break
      }
    }
  }

  await SDK.init(config)
}

main()
