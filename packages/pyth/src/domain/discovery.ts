import {
  AccountsType,
  ParsedAccountsData,
  PriceComponentBN,
  PriceDataBN,
  PythAccountInfo,
} from '../types.js'
import { config } from '@aleph-indexer/core'
import { PYTH_PROGRAM_ID, PYTH_PROGRAM_ID_PK } from '../constants.js'
import { solanaPrivateRPC } from '@aleph-indexer/solana'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import {
  parseBaseData,
  parsePriceData,
  parseProductData,
} from '@pythnetwork/client'
import BN from 'bn.js'

export default class DiscoveryHelper {
  constructor(
    public accountTypes: Set<AccountsType> = new Set(
      Object.values(AccountsType),
    ),
    protected cache: Record<string, PythAccountInfo> = {},
  ) {}

  async loadAccounts(): Promise<PythAccountInfo[]> {
    const newAccounts: PythAccountInfo[] = []
    let accounts = await this.getAllAccounts()
    if (config.INDEXED_ACCOUNTS) {
      const indexedTokens = config.INDEXED_ACCOUNTS.split(',')
      accounts = accounts.filter((account) =>
        indexedTokens.includes(account.address),
      )
    }

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
    const productAccounts = await connection.getProgramAccounts(
      PYTH_PROGRAM_ID_PK,
    )

    for (const account of productAccounts) {
      const base = parseBaseData(account.account.data)
      if (base && base.type === 2) {
        const accountInfo = await this.deserializeAccountResponse(
          account,
          AccountsType.PriceAccount,
        )
        accountsInfo.push(accountInfo)
      }
    }

    return accountsInfo
  }

  async deserializeAccountResponse(
    resp: { pubkey: PublicKey; account: AccountInfo<Buffer> },
    type: AccountsType,
  ): Promise<PythAccountInfo> {
    const data: ParsedAccountsData = await this.getParsedAccountData(
      resp.account.data,
    )
    const address = data.priceAccountKey.toString()
    // Parsing names from on-chain account data can be complicated at times...
    let name: string = resp.pubkey.toBase58()
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

  async getParsedAccountData(
    data: Buffer,
  ): Promise<ParsedAccountsData> {
    const connection = solanaPrivateRPC.getConnection()
    const responseProduct = parseProductData(data)
    if (responseProduct.priceAccountKey) {
      const priceAccount = await connection.getAccountInfo(
        responseProduct.priceAccountKey,
      )
      if (priceAccount) {
        const currentSlot = await connection.getSlot('finalized')
        const parsedPriceData = parsePriceData(priceAccount?.data, currentSlot)
        const castedPriceComponents: PriceComponentBN[] =
          parsedPriceData.priceComponents.map((component) => {
            return {
              publisher: component.publisher,
              aggregate: {
                priceComponent: new BN(
                  Number(component.aggregate.priceComponent),
                ),
                price: component.aggregate.price,
                confidenceComponent: new BN(
                  Number(component.aggregate.confidenceComponent),
                ),
                confidence: component.aggregate.confidence,
                status: component.aggregate.status,
                corporateAction: component.aggregate.corporateAction,
                publishSlot: component.aggregate.publishSlot,
              },
              latest: {
                priceComponent: new BN(Number(component.latest.priceComponent)),
                price: component.latest.price,
                confidenceComponent: new BN(
                  Number(component.latest.confidenceComponent),
                ),
                confidence: component.latest.confidence,
                status: component.latest.status,
                corporateAction: component.latest.corporateAction,
                publishSlot: component.latest.publishSlot,
              },
            }
          })
        const castedPriceData: PriceDataBN = {
          magic: parsedPriceData.magic,
          version: parsedPriceData.version,
          type: parsedPriceData.type,
          size: parsedPriceData.size,
          priceType: parsedPriceData.priceType,
          exponent: parsedPriceData.exponent,
          numComponentPrices: parsedPriceData.numComponentPrices,
          numQuoters: parsedPriceData.numQuoters,
          lastSlot: new BN(Number(parsedPriceData.lastSlot)),
          validSlot: new BN(Number(parsedPriceData.validSlot)),
          emaPrice: {
            valueComponent: new BN(
              Number(parsedPriceData.emaPrice.valueComponent),
            ),
            value: parsedPriceData.emaPrice.value,
            numerator: new BN(Number(parsedPriceData.emaPrice.numerator)),
            denominator: new BN(Number(parsedPriceData.emaPrice.denominator)),
          },
          emaConfidence: {
            valueComponent: new BN(
              Number(parsedPriceData.emaConfidence.valueComponent),
            ),
            value: parsedPriceData.emaConfidence.value,
            numerator: new BN(Number(parsedPriceData.emaConfidence.numerator)),
            denominator: new BN(
              Number(parsedPriceData.emaConfidence.denominator),
            ),
          },
          timestamp: new BN(Number(parsedPriceData.timestamp)),
          minPublishers: parsedPriceData.minPublishers,
          drv2: parsedPriceData.drv2,
          drv3: parsedPriceData.drv3,
          drv4: parsedPriceData.drv4,
          productAccountKey: parsedPriceData.productAccountKey,
          nextPriceAccountKey: parsedPriceData.nextPriceAccountKey,
          previousSlot: new BN(Number(parsedPriceData.previousSlot)),
          previousPriceComponent: new BN(
            Number(parsedPriceData.previousPriceComponent),
          ),
          previousPrice: parsedPriceData.previousPrice,
          previousConfidenceComponent: new BN(
            Number(parsedPriceData.previousConfidenceComponent),
          ),
          previousConfidence: parsedPriceData.previousConfidence,
          previousTimestamp: new BN(Number(parsedPriceData.previousTimestamp)),
          priceComponents: castedPriceComponents,
          aggregate: {
            priceComponent: new BN(
              Number(parsedPriceData.aggregate.priceComponent),
            ),
            price: parsedPriceData.aggregate.price,
            confidenceComponent: new BN(
              Number(parsedPriceData.aggregate.confidenceComponent),
            ),
            confidence: parsedPriceData.aggregate.confidence,
            status: parsedPriceData.aggregate.status,
            corporateAction: parsedPriceData.aggregate.corporateAction,
            publishSlot: parsedPriceData.aggregate.publishSlot,
          },
          price: parsedPriceData.price,
          confidence: parsedPriceData.confidence,
          status: parsedPriceData.status,
        }
        return {
          ...castedPriceData,
          priceAccountKey: responseProduct.priceAccountKey,
          product: responseProduct.product,
        }
      } else {
        throw new Error('getAccountInfo undefined response for price account')
      }
    } else {
      throw new Error('price account undefined inside the product account')
    }
  }
}
