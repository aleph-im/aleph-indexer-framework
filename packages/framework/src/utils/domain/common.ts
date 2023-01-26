import {
  Blockchain,
  BlockchainIndexerWorkerI,
  ParsedTransaction,
} from '../../main.js'
import { WorkerKind } from '../workers.js'

export async function importBlockchainWorkerIndexerDomain(
  kind: WorkerKind,
  supportedBlockchains: Blockchain[],
  ...args: any[]
): Promise<
  Record<Blockchain, BlockchainIndexerWorkerI<ParsedTransaction<unknown>>>
> {
  const blockchainInstances = await Promise.all(
    supportedBlockchains.map(async (blockchainId) => {
      if (blockchainId === Blockchain.Ethereum) {
        const module = await import(`@aleph-indexer/${blockchainId}`)
        const factory = module.default?.[kind]?.domain?.worker

        if (!factory)
          throw new Error(
            `Module not found, try: npm i @aleph-indexer/${blockchainId}`,
          )

        const instance = await factory(...args)
        return [blockchainId, instance]
      } else {
        const module = await import(`./${kind}/worker/impl/${blockchainId}.js`)
        const clazz = module.default
        const instance = new clazz(...args)
        return [blockchainId, instance]
      }
    }),
  )

  return Object.fromEntries(blockchainInstances)
}
