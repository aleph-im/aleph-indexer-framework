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
    // const alephToken = '0x27702a26126e0b3702af63ee09ac4d1a084ef628'
    // const example = '0x159a5ef80524a18e8a03a73213ea5d059400f33b'
    const alephMessages = '0x166fd4299364B21c7567e163d85D78d2fb2f8Ad5'

    return [
      // {
      //   blockchainId: Blockchain.Ethereum,
      //   account: alephToken,
      //   meta: undefined,
      //   index: {
      //     transactions: {
      //       chunkDelay: 0,
      //       chunkTimeframe: 1000 * 60 * 60 * 24,
      //     },
      //     content: false,
      //   },
      // },
      {
        blockchainId: Blockchain.Ethereum,
        account: alephMessages,
        meta: undefined,
        index: {
          transactions: {
            chunkDelay: 0,
            chunkTimeframe: 1000 * 60 * 60 * 24,
          },
          content: false,
        },
      },
    ]
  }
}
