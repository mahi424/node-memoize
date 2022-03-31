import * as Debug from 'debug';
import { ICache } from './Cache';

const debug = Debug('node-memoize');

function memoize(
  func,
  resolver: Function | null = null,
  Cache: ICache | null = null,
) {
  if (
    typeof func !== 'function' ||
    (resolver != null && typeof resolver !== 'function')
  ) {
    throw new TypeError('Expected a function');
  }
  const memoized = async function (...args) {
    let key;
    debug('func.name', func.name);
    if (resolver) {
      debug('resolver', resolver, { ...args });
      key = func.name + resolver.apply(this, [{ ...args }]);
    } else {
      debug('no resolver');
      key = func.name + args[0];
    }
    debug({ key, args });
    const cache = memoized.cache;
    if (await cache.has(key)) {
      debug('from cache');
      // console.log('from cache');

      return await cache.get(key);
    }
    const result = await func.apply(this, args);
    memoized.cache = (await cache.set(key, result)) || cache;
    return result;
  };
  memoized.cache = Cache ? Cache : new Map();
  return memoized;
}
export default memoize;
