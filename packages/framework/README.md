# Framework Package


Contains all high-level abstractions for building multithreaded indexers on Aleph.

## TODO

- Improve stats calculation performance caching already processed events for larger time frames. For example if we only configure just one big time frame like "Year" without configuring others smaller than it, we will reprocess all the events in the last year for each new incoming event
- Change all time ranges bounds calculations to [inclusive left bound, exclusive right bound), except for databases in which both bound should be inclusive.
- Allow to pass a custom stats schema to the graphQL base class
- Implement a new option in the stats class for calculating accumulated values in time series
- Implement a broadcasting algorithm for sharing history backups between fetcher instances
- Allow to include custom schemas on the parser, from the development side
