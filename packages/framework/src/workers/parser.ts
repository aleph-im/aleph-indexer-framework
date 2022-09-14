/**
 * Bootstrapping file for the parser worker.
 */
import { workerData } from 'worker_threads'
import { ParserMs, ParserMsMain } from '../services/parser'
import { solana, solanaMainPublic } from '../solanaRpc.js'
import { getMoleculerBroker } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'

initThreadContext()

async function main() {
  const { name, transport, channels, tcpPort } = workerData as WorkerInfo

  const broker = getMoleculerBroker(name, transport, {
    channels,
    port: tcpPort,
  })

  ParserMs.mainFactory = () =>
    new ParserMsMain(broker, solana, solanaMainPublic)

  broker.createService(ParserMs)
  await broker.start()
}

main()
