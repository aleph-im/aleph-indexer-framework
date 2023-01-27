/**
 * Bootstrapping file for the parser worker.
 */
import path from 'path'
import { workerData } from 'worker_threads'
import { ParserMs } from '../services/parser/index.js'
import { getMoleculerBroker } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'
import { createParserMsMain } from './common.js'

initThreadContext()

async function main() {
  const {
    name,
    transport,
    transportConfig,
    channels,
    layoutPath,
    supportedBlockchains,
  } = workerData as WorkerInfo

  const basePath = path.join(workerData.dataPath, name)

  const broker = getMoleculerBroker(name, transport, {
    channels,
    transportConfig,
  })

  const parserMsMain = await createParserMsMain(
    supportedBlockchains,
    basePath,
    broker,
    layoutPath,
  )

  ParserMs.mainFactory = () => parserMsMain
  ParserMs.supportedBlockchains = supportedBlockchains

  broker.createService(ParserMs)
  await broker.start()
}

main()
