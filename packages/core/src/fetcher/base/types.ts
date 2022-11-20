import { JobRunnerOptions } from '../../utils/index.js'

// ------------------------ Options ---------------------

export type FetcherJobRunnerHandleFetchResult<C> = {
  error?: Error
  newInterval?: number
  lastCursor: C
}

export type FetcherJobRunnerUpdateCursorResult<C> = {
  newItems: boolean
  newCursor: C
}

export type BaseFetcherJobRunnerOptions<C> = Omit<
  JobRunnerOptions,
  'name' | 'intervalFn'
> & {
  handleFetch: (ctx: {
    firstRun: boolean
    interval: number
  }) => Promise<FetcherJobRunnerHandleFetchResult<C>>
  updateCursor: (ctx: {
    type: 'forward' | 'backward'
    prevCursor?: C
    lastCursor: C
  }) => Promise<FetcherJobRunnerUpdateCursorResult<C>>
}

export interface BaseFetcherOptions<C> {
  id: string
  forward?: BaseFetcherJobRunnerOptions<C>
  backward?: BaseFetcherJobRunnerOptions<C>
}

// ---------------------- State --------------------------

export type BaseFetcherJobState<C> = {
  frequency: number
  lastRun: number
  numRuns: number
  complete: boolean
  useHistoricRPC: boolean
}

export type BaseFetcherState<C> = {
  id: string
  forward: BaseFetcherJobState<C>
  backward: BaseFetcherJobState<C>
  cursor?: C
}

export type ParserContext = {
  account: string
  startDate: number
  endDate: number
}
