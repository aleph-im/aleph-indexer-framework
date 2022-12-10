import { JobRunnerOptions } from '../../utils/index.js'

// ---------------------- Pagination --------------------------

export interface BaseFetcherPaginationCursors<C> {
  backward?: C
  forward?: C
}

export type BaseFetcherPaginationResponse<D, C> = {
  cursors: BaseFetcherPaginationCursors<C>
  chunk: D[]
}

// ------------------------ Options ---------------------

export type FetcherJobRunnerHandleFetchResult<C> = {
  error?: Error
  newInterval?: number
  lastCursors: BaseFetcherPaginationCursors<C>
}

export type FetcherJobRunnerUpdateCursorResult<C> = {
  newItems: boolean
  newCursors: BaseFetcherPaginationCursors<C>
}

export type BaseFetcherJobRunnerOptions<C> = Omit<
  JobRunnerOptions,
  'name' | 'intervalFn'
> & {
  handleFetch: (ctx: {
    firstRun: boolean
    interval: number
  }) => Promise<FetcherJobRunnerHandleFetchResult<C>>
  updateCursors?: (ctx: {
    prevCursors?: BaseFetcherPaginationCursors<C>
    lastCursors: BaseFetcherPaginationCursors<C>
  }) => Promise<FetcherJobRunnerUpdateCursorResult<C>>
  checkComplete?: (ctx: {
    fetcherState: BaseFetcherState<C>
    jobState: BaseFetcherJobState
    newItems: boolean
    error?: Error
  }) => Promise<boolean>
}

export interface BaseFetcherOptions<C> {
  id: string
  jobs?: {
    forward?: BaseFetcherJobRunnerOptions<C>
    backward?: BaseFetcherJobRunnerOptions<C>
  }
}

// ---------------------- State --------------------------

export type BaseFetcherJobState = {
  frequency?: number
  lastRun: number
  numRuns: number
  complete: boolean
  useHistoricRPC: boolean
}

export type BaseFetcherJobStates = {
  forward: BaseFetcherJobState
  backward: BaseFetcherJobState
}

export type BaseFetcherState<C> = {
  id: string
  jobs: BaseFetcherJobStates
  cursors?: BaseFetcherPaginationCursors<C>
}
