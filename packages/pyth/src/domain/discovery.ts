import { AccountsType } from '../layouts/accounts.js'
import { ParsedAccountsData, PythAccountInfo } from '../types.js'
import { PYTH_PROGRAM_ID, PYTH_PROGRAM_ID_PK } from '../constants.js'
import { ACCOUNT_DISCRIMINATOR } from '../layouts/accounts.js'
import { solanaPrivateRPC } from '@aleph-indexer/core'
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js'
import {
  parseBaseData,
  parsePriceData,
  parseProductData,
  Base,
} from '@pythnetwork/client'

export default class DiscoveryHelper {
  constructor(
    public accountTypes: Set<AccountsType> = new Set(
      Object.values(AccountsType),
    ),
    protected cache: Record<string, PythAccountInfo> = {},
  ) {}

  async loadAccounts(): Promise<PythAccountInfo[]> {
    const newAccounts: PythAccountInfo[] = []
    const accounts = await this.getAllAccounts()

    for (const accountInfo of accounts) {
      if (this.cache[accountInfo.address]) continue

      this.cache[accountInfo.address] = accountInfo
      newAccounts.push(this.cache[accountInfo.address])
    }

    return newAccounts
  }

  getAccountType(address: string): AccountsType {
    return this.cache[address].type
  }

  /**
   * Fetches all accounts from the program. Useful to filter which accounts should be indexed.
   */
  async getAllAccounts(): Promise<PythAccountInfo[]> {
    const connection = solanaPrivateRPC.getConnection()
    const accountsInfo: PythAccountInfo[] = []
    // todo: If you want to only index a subset of account types, you can filter them here
    const accountTypesToFilter: AccountsType[] = []
    for (const type of this.accountTypes) {
      if (accountTypesToFilter.includes(type)) continue
      const accounts = await connection.getProgramAccounts(PYTH_PROGRAM_ID_PK, {
        filters: [
          {
            memcmp: {
              bytes: ACCOUNT_DISCRIMINATOR[type].toString(),
              offset: 8,
            },
          },
        ],
      })
      accounts.map(
        async (value: { pubkey: PublicKey; account: AccountInfo<Buffer> }) => {
          const base = parseBaseData(value.account.data)
          if (base && (base.version === 2 || base.version === 3)) {
            accountsInfo.push(
              await this.deserializeAccountResponse(
                value,
                type,
                connection,
                base,
              ),
            )
          }
        },
      )
    }
    return accountsInfo
  }

  async deserializeAccountResponse(
    resp: { pubkey: PublicKey; account: AccountInfo<Buffer> },
    type: AccountsType,
    connection: Connection,
    base: Base,
  ): Promise<PythAccountInfo> {
    const currentSlot = await connection.getSlot('finalized')
    const data: ParsedAccountsData = this.parseAccountData(
      base,
      currentSlot,
      resp.account.data,
    )

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
      programId: PYTH_PROGRAM_ID,
      type,
      address: address,
      data: data,
    }
  }

  parseAccountData(
    base: Base | undefined,
    currentSlot: number,
    data: Buffer,
  ): ParsedAccountsData {
    if (base) {
      switch (base.type) {
        case 2:
          return {
            ...base,
            ...parseProductData(data),
          }
        case 3:
          return {
            ...base,
            ...parsePriceData(data, currentSlot),
          }
        default:
          throw new Error(
            `Unknown account type: ${base.type}. Try upgrading discovery file, new account not defined detected.`,
          )
      }
    } else {
      throw new Error(`Error, got undefined base account data`)
    }
  }
}
