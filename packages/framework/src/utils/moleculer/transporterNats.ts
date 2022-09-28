import { Transporters } from 'moleculer'

// @note: Type problems overriding methods
const SuperClass: any = Transporters.NATS

export class FrameworkNatsTransporter extends SuperClass {
  constructor(protected nodeID: string, opts: any = {}) {
    if (opts.url) {
      const url = opts.url.replace('nats://', '')
      const parts = url.split('@')

      if (parts.length > 1) {
        const [credentials, rest] = parts
        const [user, pass] = credentials.split(':')

        opts.url = `nats://${rest}`

        if (pass) {
          opts.user = user
          opts.pass = pass
        } else {
          opts.token = user
        }
      }
    }

    super(opts)
  }
}
