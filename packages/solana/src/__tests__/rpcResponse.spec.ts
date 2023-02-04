import { PublicKey } from '@solana/web3.js'
import { SolanaRPC } from '../sdk/index.js'
import { config } from '@aleph-indexer/core'

describe('rpc responses validation test', () => {
  const rpc = new SolanaRPC({
    url: 'https://solana-mainnet.g.alchemy.com/v2/UKpJEi5xcwjCtOXHye7pjfnkhbOUOqM2',
    rateLimit: true,
  })
  config.STRICT_CHECK_RPC = 'true'

  it('getTransaction', async () => {
    await rpc.getConfirmedTransaction(
      'HBxnu98xLrw5xBooSwP2DiPfB9u9SCd7CevLjT9MGA9nyhEGnWtQGCvUCv5Ho89n9DJx3wFzhSDz4yKYkZTnvCh',
    )
  })
  it('getVoteAccount', async () => {
    await rpc.getVoteAccount('8ZvTbWfA7txjkNubA9jnv8CWQtwbaZSzpf7vaDDcxMr5')
  })
  it('getSupply', async () => {
    await rpc.getSupply()
  })
  // need a private rpc to test it, receiving too many requests error
  it('getSignaturesForAddress', async () => {
    await rpc.getSignaturesForAddress(
      new PublicKey('AYKn9YzPe91XzeoD9hLJLTx8RXKjNDaCTiUJvD8LRsju'),
    )
  })
  it('getConfirmedTransaction', async () => {
    await rpc.getConfirmedTransaction(
      '67pce7K5zCvkK3mu3Y5oLztrf6d3n1VvoYFTtPEdkUgG5MRUfoetLugxi21QQywy5a4ppNPL3y2uYe1H8TK48uAm',
    )
  })
  it('getConfirmedTransactions', async () => {
    const signatures = [
      '67pce7K5zCvkK3mu3Y5oLztrf6d3n1VvoYFTtPEdkUgG5MRUfoetLugxi21QQywy5a4ppNPL3y2uYe1H8TK48uAm',
    ]
    await rpc.getConfirmedTransactions(signatures)
  })
})
