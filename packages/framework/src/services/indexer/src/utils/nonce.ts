export class NonceTimestamp {
  protected last = 0

  get(): number {
    let t = Date.now()

    if (this.last >= t) {
      t = this.last + 1
    }

    this.last = t
    return t
  }
}
