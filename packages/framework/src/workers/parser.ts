/**
 * Bootstrapping file for the parser worker.
 */
import { workerData } from 'worker_threads'
import { ParserMs, ParserMsMain } from '../services/parser/index.js'
import { solana, solanaMainPublic } from '../solanaRpc.js'
import { getMoleculerBroker } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'

initThreadContext()

async function main() {
  const { name, transport, transportConfig, channels } =
    workerData as WorkerInfo

  const broker = getMoleculerBroker(name, transport, {
    channels,
    transportConfig,
  })

  ParserMs.mainFactory = () =>
    new ParserMsMain(broker, solana, solanaMainPublic)

  broker.createService(ParserMs)
  await broker.start()
}

main()
