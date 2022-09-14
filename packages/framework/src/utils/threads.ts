import os from 'os'
import { EventEmitter } from 'events'

/**
 * Sets the node.js context for the workers to:
 * - disable event emitter warnings
 * - 8 GB of memory
 * - Max number of threads (restricted by $UV_THREADPOOL_SIZE)
 * - Further node options (set by $NODE_OPTIONS)
 * - To log unhandled rejections and uncaught exceptions
 */
export function initThreadContext(): void {
  // Disable event emitter warning
  EventEmitter.defaultMaxListeners = 100000

  // max old heap mem size
  process.env.NODE_OPTIONS =
    process.env.NODE_OPTIONS || '--max-old-space-size=8192' // 8gb

  // libuv max threads
  const cpus = os.cpus().length
  process.env.UV_THREADPOOL_SIZE =
    process.env.UV_THREADPOOL_SIZE || cpus.toString()

  console.log('UV_THREADPOOL_SIZE', process.env.UV_THREADPOOL_SIZE)
  console.log('NODE_OPTIONS', process.env.NODE_OPTIONS)

  process.on('uncaughtException', (e) => {
    console.log('uncaughtException', e)
  })

  process.on('unhandledRejection', (e) => {
    console.log('unhandledRejection', e)
  })
}
