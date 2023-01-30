# SPL Token Snapshot

## Configuration

Set the `SPL_TOKEN_MINTS` environment variable with the token mints
separated by comas to index these tokens, similar to the [SPL Token](https://github.com/aleph-im/solana-indexer-library/tree/main/packages/spl-token) indexer.
You can also set the `SPL_TOKEN_ACCOUNTS` environment variable with the specific accounts you want to index.

### Example

To index the mSOL token balances, set the `SPL_TOKEN_MINTS` environment variable to:

``` sh
SPL_TOKEN_MINTS=mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So
```

Currently, the [.env.default](https://github.com/MHHukiewitz/solana-indexer-library/blob/feat/token-snapshot/.env.defaults)
file is configured to index the mSOL token mint with the `token-snapshot` indexer.
Therefore, you can just run

``` sh
npm run start token-snapshot
```

from the root of the project to start the indexer locally. A GraphiQL interface will be available at http://localhost:8080.

It will take a while to index all the accounts, but you can see the progress when querying:

``` graphql
accountState{
  account
  accurate
  progress
  pending
  processed
}
```

To get all the balances of accounts with at least 1 lamport of the token on Sun Jan 01 2023 00:00:00 GMT+0000, you can
query:

``` graphql
  tokenHolders(
    gte: "1",
    mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"
    timestamp: 1672531200000
  ) {
    timestamp
    owner
    account
    balances {
      total
    }
  }
```

### ToDos

- [ ] Add indicator whether an account belongs to a Solana program
- [ ] Add parsing of lending program instructions to also index the collateral and borrow balances
  - [ ] Solend
  - [ ] Port
  - [ ] Larix

## Deploying the indexer

Follow the guide of the main [README.md](https://github.com/aleph-im/solana-indexer-library/blob/main/README.md) file
to publish it in Aleph.IM network using different methods.
