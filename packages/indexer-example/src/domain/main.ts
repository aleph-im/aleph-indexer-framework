import { Blockchain } from '@aleph-indexer/framework'
import {
  IndexerMainDomain,
  IndexerMainDomainWithDiscovery,
  AccountIndexerConfigWithMeta,
  IndexerMainDomainContext,
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

  async discoverAccounts(): Promise<AccountIndexerConfigWithMeta<undefined>[]> {
    const alephTokenEth = '0x27702a26126e0b3702af63ee09ac4d1a084ef628'
    const alephTokenSol = '3UCMiSnkcnkPE1pgQ5ggPCBv6dXgVUy16TmMUe1WpG9x'
    const alephMessages = '0x166fd4299364B21c7567e163d85D78d2fb2f8Ad5'

    return [
      {
        blockchainId: Blockchain.Ethereum,
        account: alephTokenEth,
        meta: undefined,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          state: false,
        },
      },
      {
        blockchainId: Blockchain.Solana,
        account: alephTokenSol,
        meta: undefined,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          state: false,
        },
      },
      {
        blockchainId: Blockchain.Ethereum,
        account: alephMessages,
        meta: undefined,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          state: false,
        },
      },
    ]
  }
}
