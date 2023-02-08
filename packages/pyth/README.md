# PYTH INDEXER

INDEXES PYTH.

## TODO:

- [x] Parsing instructions
- [x] Filter events
- [X] Parsing accounts
- [ ] Calculating stats
    - [X] Aggregate stats
    - [X] OHLC
    - [ ] Global stats
        - [ ] Cache
- [x] Store prices in database
- [ ] Store stats in database
- [ ] API
    - [ ] Resolvers
    - [ ] GraphQL schema
    - [ ] GraphQL type definitions

Full account info query:

{
  accounts(accounts:"3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW"){
    name
    programId
    address
    type
    data {
      priceAccountKey
      product {
        symbol,
        asset_type,
        quote_currency,
        tenor,
        price_account,
        index,
      },
      priceType,
      exponent,
      numComponentPrices,
      numQuoters,
      lastSlot,
      validSlot,
      emaPrice {
        valueComponent,
        value,
        numerator,
        denominator,
      },
      emaConfidence {
        valueComponent,
        value,
        numerator,
        denominator,
      },
      timestamp,
      minPublishers,
      drv2,
      drv3,
      drv4,
      productAccountKey,
      nextPriceAccountKey,
      previousSlot,
      previousPriceComponent,
      previousPrice,
      previousConfidenceComponent,
      previousConfidence,
      previousTimestamp,
      priceComponents {
        publisher
        aggregate {
          price,
          priceComponent,
          confidenceComponent,
          confidence,
          status,
          corporateAction,
          publishSlot,
        }
        latest {
          price,
          priceComponent,
          confidenceComponent,
          confidence,
          status,
          corporateAction,
          publishSlot,
        }
      },
      aggregate {
        price,
        priceComponent,
        confidenceComponent,
        confidence,
        status,
        corporateAction,
        publishSlot,
      },
      price,
      confidence,
      status,
    },
  }
}
