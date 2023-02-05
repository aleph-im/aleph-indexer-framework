import { Blockchain } from '@aleph-indexer/framework'
import { EthereumClient, EthereumClientOptions } from '@aleph-indexer/ethereum'
import { EthereumAccountTransactionHistoryStorage } from '../services/fetcher/src/transaction/dal/accountTransactionHistory.js'
import { EthereumLogBloomStorage } from '../services/fetcher/src/log/dal/logBloom.js'

export class BscClient extends EthereumClient {
  constructor(
    protected options: EthereumClientOptions,
    protected accountSignatureDAL?: EthereumAccountTransactionHistoryStorage,
    protected logBloomDAL?: EthereumLogBloomStorage,
    protected blockchainId: Blockchain = Blockchain.Bsc,
  ) {
    super(options, accountSignatureDAL, logBloomDAL, blockchainId)

    // @note: Quick fix for BSC it doesn't affect ethereum
    // Take a look at https://github.com/web3/web3.js/pull/3948#issuecomment-821779691
    // @note: Take a look at:
    // @note: https://github.com/web3/web3.js/pull/3948#issuecomment-821779691
    console.log('⚡️ monkey patched "web3-utils" "hexToNumber" for BSC chain')

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
