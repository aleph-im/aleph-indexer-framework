import { DataFeedInfo } from '../types.js'
import { PythConnection } from '@pythnetwork/client'
import {
  AccountType,
  parseBaseData,
  parseProductData,
  PYTH,
} from '../utils/pyth-sdk.js'
import { PublicKey } from '@solana/web3.js'

export class DiscoveryHelper {
  constructor(
    protected sdk: PythConnection = PYTH,
    protected cache: Record<string, DataFeedInfo> = {},
  ) {}

  async loadProducts(): Promise<DataFeedInfo[]> {
    const accounts = await PYTH.connection.getProgramAccounts(
      PYTH.pythProgramKey,
      PYTH.commitment,
    )
    return accounts
      .map((account) => {
        const data = parseBaseData(account.account.data)
        if (data?.type !== AccountType.Product) return undefined
        return {
          address: account.pubkey.toBase58(),
          ...parseProductData(account.account.data),
        }
      })
      .filter((data) => data) as DataFeedInfo[]
  }

  async loadProduct(address: string): Promise<DataFeedInfo> {
    const account = await PYTH.connection.getAccountInfo(
      new PublicKey(address),
      PYTH.commitment,
    )
    return {
      address: address,
      ...parseProductData(account!.data),
    }
  }
}

export const discoveryHelper = new DiscoveryHelper()
export default discoveryHelper
