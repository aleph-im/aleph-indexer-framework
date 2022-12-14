/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import * as beet from '@metaplex-foundation/beet'
import { AccountHeader, accountHeaderBeet } from '../types/AccountHeader.js'
import { Product, productBeet } from '../types/Product.js'

/**
 * Arguments used to create {@link ProductAccount}
 * @category Accounts
 * @category generated
 */
export type ProductAccountArgs = {
  header: AccountHeader
  priceAccountKey: web3.PublicKey
  product: Product
}

export const productAccountDiscriminator = '2'
/**
 * Holds the data for the {@link ProductAccount} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class ProductAccount implements ProductAccountArgs {
  private constructor(
    readonly header: AccountHeader,
    readonly priceAccountKey: web3.PublicKey,
    readonly product: Product,
  ) {}

  /**
   * Creates a {@link ProductAccount} instance from the provided args.
   */
  static fromArgs(args: ProductAccountArgs) {
    return new ProductAccount(args.header, args.priceAccountKey, args.product)
  }

  /**
   * Deserializes the {@link ProductAccount} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0,
  ): [ProductAccount, number] {
    return ProductAccount.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link ProductAccount} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig,
  ): Promise<ProductAccount> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig,
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find ProductAccount account at ${address}`)
    }
    return ProductAccount.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH',
    ),
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, productAccountBeet)
  }

  /**
   * Deserializes the {@link ProductAccount} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [ProductAccount, number] {
    return productAccountBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link ProductAccount} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return productAccountBeet.serialize({
      accountDiscriminator: productAccountDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link ProductAccount} for the provided args.
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   */
  static byteSize(args: ProductAccountArgs) {
    const instance = ProductAccount.fromArgs(args)
    return productAccountBeet.toFixedFromValue({
      ...instance,
    }).byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link ProductAccount} data from rent
   *
   * @param args need to be provided since the byte size for this account
   * depends on them
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    args: ProductAccountArgs,
    connection: web3.Connection,
    commitment?: web3.Commitment,
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      ProductAccount.byteSize(args),
      commitment,
    )
  }

  /**
   * Returns a readable version of {@link ProductAccount} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      header: this.header,
      priceAccountKey: this.priceAccountKey.toBase58(),
      product: this.product,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const productAccountBeet = new beet.FixableBeetStruct<
  ProductAccount,
  ProductAccountArgs
>(
  [
    ['header', accountHeaderBeet],
    ['priceAccountKey', beetSolana.publicKey],
    ['product', productBeet],
  ],
  ProductAccount.fromArgs,
  'ProductAccount',
)
