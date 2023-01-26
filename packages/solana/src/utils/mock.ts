import { Transaction, PublicKey } from '@solana/web3.js'

export class SolanaMockWallet {
  async signTransaction(tx: Transaction): Promise<Transaction> {
    return tx
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return txs
  }

  get publicKey(): PublicKey {
    return new PublicKey('')
  }
}
