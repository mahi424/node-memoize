import { _function } from './interfaces';

export class Cache {
  set: _function;
  has: _function;
  get: _function;
  constructor(setFn: _function, hasFn: _function, getFn: _function) {
    this.set = setFn;
    this.has = hasFn;
    this.get = getFn;
  }
}
export type ICache = Cache
