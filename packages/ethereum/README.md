# Ethereum Connector
This connector allows your indexer to index data from the Ethereum blockchain.

It indexes data differently from the Solana indexer, as it is not possible to call
`getConfirmedSignaturesForAddress` on the Ethereum blockchain. Instead, it can index
events and logs emitted by smart contracts. This is reflected in the

[`IndexableEntityType`](../framework/src/types.ts)
