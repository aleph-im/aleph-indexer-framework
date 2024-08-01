import { BlockchainId } from '@aleph-indexer/framework'
import {
  EthereumAccountTransactionHistoryStorage,
  EthereumClient,
  EthereumClientOptions,
  EthereumLogBloomStorage,
} from '@aleph-indexer/ethereum'

export class AvalancheClient extends EthereumClient {
  protected genesisBlockTimestamp = 0

  constructor(
    protected blockchainId: BlockchainId,
    protected options: EthereumClientOptions,
    protected accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
    protected logBloomDAL?: EthereumLogBloomStorage,
  ) {
    super(blockchainId, options, accountSignatureDAL, logBloomDAL)

    // @note: Quick fix for AVALANCHE it doesn't affect ethereum
    // Take a look at https://github.com/web3/web3.js/pull/3948#issuecomment-821779691
    // @note: Take a look at:
    // @note: https://github.com/web3/web3.js/pull/3948#issuecomment-821779691
    console.log(
      '⚡️ monkey patched "web3-utils" "hexToNumber" for AVALANCHE chain',
    )

    const hexToNumberOld = this.sdk.utils.hexToNumber
    this.sdk.utils.hexToNumber = function (value) {
      try {
        return hexToNumberOld(value)
      } catch (e: any) {
        if (e?.message !== 'Number can only safely store up to 53 bits') throw e
        return Number.MAX_SAFE_INTEGER
      }
    }
  }
}
