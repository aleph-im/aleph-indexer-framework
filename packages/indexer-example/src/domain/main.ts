import {
  AccountIndexerConfigWithMeta,
  Blockchain,
  IndexerMainDomain,
  IndexerMainDomainContext,
  IndexerMainDomainWithDiscovery,
} from '@aleph-indexer/framework'

export default class MainDomain
  extends IndexerMainDomain
  implements IndexerMainDomainWithDiscovery
{
  constructor(protected context: IndexerMainDomainContext) {
    super(context, {
      discoveryInterval: 1000 * 60 * 60 * 1,
    })
  }

  async discoverAccounts(): Promise<AccountIndexerConfigWithMeta<number>[]> {
    const alephTokenEth = '0x27702a26126e0b3702af63ee09ac4d1a084ef628'
    const alephTokenBsc = '0x82D2f8E02Afb160Dd5A480a617692e62de9038C4'
    const alephTokenSol = '3UCMiSnkcnkPE1pgQ5ggPCBv6dXgVUy16TmMUe1WpG9x'

    let accountIndexerConfigs = []
    if (this.context.supportedBlockchains.includes(Blockchain.Ethereum))
      accountIndexerConfigs.push({
        blockchainId: Blockchain.Ethereum,
        account: alephTokenEth,
        meta: 1,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          state: false,
          logs: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
        },
      })
    if (this.context.supportedBlockchains.includes(Blockchain.Solana))
      accountIndexerConfigs.push({
        blockchainId: Blockchain.Solana,
        account: alephTokenSol,
        meta: 2,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          state: false,
          logs: false,
        },
      })
    if (this.context.supportedBlockchains.includes(Blockchain.Bsc))
      accountIndexerConfigs.push({
        blockchainId: Blockchain.Bsc,
        account: alephTokenBsc,
        meta: 3,
        index: {
          transactions: false,
          state: false,
          logs: true,
        },
      })

    return accountIndexerConfigs
  }
}
