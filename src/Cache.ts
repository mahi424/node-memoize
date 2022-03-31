export class Cache {
  set: Function;
  has: Function;
  get: Function;
  constructor(setFn: Function, hasFn: Function, getFn: Function) {
    this.set = setFn;
    this.has = hasFn;
    this.get = getFn;
  }
}

export interface ICache extends Cache {}
