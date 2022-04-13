import { _function } from "./interfaces";

/* eslint-disable @typescript-eslint/ban-types */
const debug = console.log;

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

export type ICache = Cache;

export function memoized(
  resolver: _function | null = null,
  Cache: ICache | null = null,
) {
  return (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    debug({ descriptor, target, propertyName });
    function decorate(func: (...args: any[]) => void) {
      async function decorator(...args: any[]) {
        let key = propertyName;
        if (args.length) {
          if (resolver) {
            debug('resolver', resolver, { ...args });
            key = propertyName + '-' + resolver.apply(this, [{ ...args }]);
          } else {
            debug('no resolver');
            key = propertyName + '-' + args[0];
          }
        }
        debug({ key, args });

        const cache = decorator.cache;
        if (await cache.has(key)) {
          debug('from cache');
          return JSON.parse(await cache.get(key) as string);
        }
        const result = await func.apply(this, args);
        await cache.set(key, JSON.stringify(result));
        return result;
      }
      decorator.cache = Cache ? Cache : new Map();
      return decorator;
    }

    if (descriptor.value != null) descriptor.value = decorate(descriptor.value);
    else if (descriptor.get != null) descriptor.get = decorate(descriptor.get);
    else
      throw new Error(
        'Only put a Memoize decorator on a method or get accessor.',
      );
  };
}

