import {
  MARINADE_FINANCE_PROGRAM_ID,
  MARINADE_FINANCE_PROGRAM_ID_PK,
} from '../../constants.js'
import { AccountType } from '../../utils/layouts/index.js'
import { MarinadeFinanceAccountInfo } from '../../types.js'
import {
  ACCOUNT_DISCRIMINATOR,
  ACCOUNTS_DATA_LAYOUT,
} from '../../utils/layouts/accounts.js'
import { solanaPrivateRPC } from '@aleph-indexer/core'
import bs58 from 'bs58'
import { AccountInfo, PublicKey } from '@solana/web3.js'

export default class MarinadeFinanceDiscoverer {
  constructor(
    public accountTypes: Set<AccountType> = new Set(Object.values(AccountType)),
    protected cache: Record<string, MarinadeFinanceAccountInfo> = {},
  ) {}

  async loadAccounts(): Promise<MarinadeFinanceAccountInfo[]> {
    const newAccounts: MarinadeFinanceAccountInfo[] = []
    const accounts = await this.getAllAccounts()

    for (const accountInfo of accounts) {
      if (this.cache[accountInfo.address]) continue

      this.cache[accountInfo.address] = accountInfo
      newAccounts.push(this.cache[accountInfo.address])
    }

    return newAccounts
  }

  getAccountType(address: string): AccountType {
    return this.cache[address].type
  }

  async getAllAccounts(): Promise<MarinadeFinanceAccountInfo[]> {
    const connection = solanaPrivateRPC.getConnection()
    const accountsInfo: MarinadeFinanceAccountInfo[] = []
    for (const type of this.accountTypes) {
      const accounts = await connection.getProgramAccounts(
        MARINADE_FINANCE_PROGRAM_ID_PK,
        {
          filters: [
            {
              memcmp: {
                bytes: bs58.encode(ACCOUNT_DISCRIMINATOR[type]),
                offset: 0,
              },
            },
          ],
        },
      )
      accounts.map(
        (value: { pubkey: PublicKey; account: AccountInfo<Buffer> }) =>
          accountsInfo.push(this.deserializeAccountResponse(value, type)),
      )
    }
    return accountsInfo
  }

  deserializeAccountResponse(
    resp: { pubkey: PublicKey; account: AccountInfo<Buffer> },
    type: AccountType,
  ): MarinadeFinanceAccountInfo {
    const data = ACCOUNTS_DATA_LAYOUT[type].deserialize(resp.account.data)[0]
    const address = resp.pubkey.toBase58()
    // Parsing names from on-chain account data can be complicated at times...
    let name: string = address
    if (Object.hasOwn(data, 'name')) {
      if ((data as any).name instanceof Uint8Array)
        name = ((data as any).name as Uint8Array).toString()
      if ((data as any).name instanceof String) name = (data as any).name
    }
    return {
      name,
      programId: MARINADE_FINANCE_PROGRAM_ID,
      type,
      address: address,
      data: data,
    }
  }
}
