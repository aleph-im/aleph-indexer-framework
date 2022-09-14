class RulesError extends Error {
  constructor(...args: any[]) {
    super(...args)
    this.name = 'RulesError'
  }
}

export type Rule<D = unknown> = (data: D) => Promise<boolean> | boolean

export interface Rules<D = unknown> {
  and?: Rule<D>[]
  not?: Rule<D>[]
  or?: Rule<D>[]
}

export class Ruler<Data = unknown> {
  constructor(
    private _name: string = 'None',
    private _rules: Required<Rules<Data>> = {
      and: [],
      not: [],
      or: [],
    },
  ) {}

  async isTrue(data: Data): Promise<boolean> {
    return this.isSatisfied(data)
  }

  async isFalse(data: Data): Promise<boolean> {
    return this.isNotSatisfied(data)
  }

  async check(data: Data): Promise<boolean> {
    return this.isSatisfied(data)
  }

  toString(): string {
    return this._name
  }

  async isSatisfied(data: Data): Promise<boolean> {
    let check = true

    try {
      await this.everyRules(this._rules.and, data)
      await this.notRules(this._rules.not, data)
    } catch (e) {
      if (!(e instanceof RulesError)) {
        throw e
      }
      check = false
    }

    // check if we have oRrules and is satisfied
    if (false === check && this._rules.or.length > 0) {
      check = await this.someRules(this._rules.or, data)
    }

    return check
  }

  async isNotSatisfied(data: Data): Promise<boolean> {
    return !(await this.isSatisfied(data))
  }

  async isStrictSatisfied(data: Data): Promise<boolean> {
    const ok = await this.isSatisfied(data)
    if (!ok) {
      throw this + ' Rules not satisfied'
    }

    return true
  }

  and(rule: Rule<Data>): this {
    this._rules.and.push(rule)
    return this
  }

  not(rule: Rule<Data>): this {
    this._rules.not.push(rule)
    return this
  }

  or(rule: Rule<Data>): this {
    this._rules.or.push(rule)
    return this
  }

  addRules(rules: Rules<Data>): this {
    rules.and?.map((rule) => this.and(rule))
    rules.not?.map((rule) => this.not(rule))
    rules.or?.map((rule) => this.or(rule))
    return this
  }

  async everyRules(rules: Rule<Data>[], data: Data): Promise<void> {
    if (rules.length > 0) {
      const values = await Promise.all(rules.map((Fn) => Fn(data)))
      const ok = values.every((isTrue) => isTrue)
      if (!ok) throw new RulesError('not satisfied')
    }
  }

  async notRules(rules: Rule<Data>[], data: Data): Promise<void> {
    if (rules.length > 0) {
      const values = await Promise.all(rules.map((Fn) => Fn(data)))
      const ok = values.some((isTrue) => isTrue)
      if (ok) throw new RulesError('not satisfied')
    }
  }

  async someRules(rules: Rule<Data>[], data: Data): Promise<boolean> {
    if (rules.length > 0) {
      const values = await Promise.all(rules.map((Fn) => Fn(data)))
      return values.some(async (isTrue) => isTrue)
    }

    return false
  }
}
