/**
 * Bootstrapping file for the fetcher worker.
 */
import path from 'path'
import { workerData } from 'worker_threads'
import {
  FetcherStateLevelStorage,
  solanaPrivateRPC,
  solanaMainPublicRPC,
  solanaPrivateRPCRoundRobin,
  solanaMainPublicRPCRoundRobin,
} from '@aleph-indexer/core'
import { FetcherMs, FetcherMsMain } from '../services/fetcher/index.js'
import { createAccountInfoDAL } from '../services/fetcher/src/dal/accountInfo.js'
import {
  createPendingTransactionCacheDAL,
  createPendingTransactionDAL,
  createPendingTransactionFetchDAL,
} from '../services/fetcher/src/dal/pendingTransaction.js'
import { createRawTransactionDAL } from '../services/fetcher/src/dal/rawTransaction.js'
import { createSignatureDAL } from '../services/fetcher/src/dal/signature.js'
import { createAccountDAL } from '../services/fetcher/src/dal/account.js'
import { getMoleculerBroker, TransportType } from '../utils/moleculer/config.js'
import { initThreadContext } from '../utils/threads.js'
import { WorkerInfo } from '../utils/workers.js'
import { MsIds } from '../services/common.js'

initThreadContext()

async function main() {
  const { name, transport, transportConfig, channels } =
    workerData as WorkerInfo

  const basePath = path.join(workerData.dataPath, name)

  // @note: Force resolve DNS and cache it before starting fetcher
  await Promise.allSettled(
    [
      ...solanaPrivateRPCRoundRobin.getAllClients(),
      ...solanaMainPublicRPCRoundRobin.getAllClients(),
    ].map(async (client) => {
      const conn = client.getConnection()
      const { result } = await (conn as any)._rpcRequest('getBlockHeight', [])
      console.log(`RPC ${conn.endpoint} last height: ${result}`)
    }),
  )

  const localBroker = getMoleculerBroker(name, TransportType.Thread, {
    channels,
  })

  const broker =
    transport !== TransportType.Thread
      ? getMoleculerBroker(name, transport, {
          channels,
          transportConfig,
        })
      : localBroker

  const fetcherServiceMain = new FetcherMsMain(
    broker,
    createSignatureDAL(basePath),
    createAccountDAL(basePath),
    createPendingTransactionDAL(basePath),
    createPendingTransactionCacheDAL(basePath),
    createPendingTransactionFetchDAL(basePath),
    createRawTransactionDAL(basePath),
    createAccountInfoDAL(basePath),
    solanaPrivateRPC,
    solanaMainPublicRPC,
    new FetcherStateLevelStorage({ path: basePath }),
  )

  FetcherMs.mainFactory = () => fetcherServiceMain

  broker.createService(FetcherMs)
  await broker.start()
  await broker.waitForServices([MsIds.Parser])

  if (localBroker !== broker) {
    localBroker.createService(FetcherMs)
    await localBroker.start()
  }
}

main()
