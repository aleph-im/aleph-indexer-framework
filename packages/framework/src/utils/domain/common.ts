import {
  Blockchain,
  BlockchainId,
  BlockchainIndexerWorkerI,
  ParsedEntity,
  getBlockchainConfig,
} from '../../main.js'
import { WorkerKind } from '../workers.js'

export async function importBlockchainWorkerIndexerDomain(
  kind: WorkerKind,
  supportedBlockchains: Blockchain[],
  ...args: any[]
): Promise<
  Record<BlockchainId, BlockchainIndexerWorkerI<ParsedEntity<unknown>>>
> {
  const blockchainInstances = await Promise.all(
    supportedBlockchains.map(async (blockchain) => {
      const { id, chain } = getBlockchainConfig(blockchain)

      const module = await import(`@aleph-indexer/${chain}`)
      const factory = module.default?.[kind]?.domain?.worker

      if (!factory)
        throw new Error(`Module not found, try: npm i @aleph-indexer/${chain}`)

      const instance = await factory(id, ...args)
      return [id, instance]
    }),
  )

  return Object.fromEntries(blockchainInstances)
}
