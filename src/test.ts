import { readFileSync } from 'fs';
import * as hash from 'object-hash';
import IoRedis from 'ioredis';

import memoize from './memoize';
// import { memoized } from './method-decorator';
import { memoized } from '../build/src/method-decorator';

import { Cache } from './Cache';

async function read(file) {
  return await readFileSync(file).toString();
}

const path = '.eslintignore';

/* test with default resolver (name + first args) */
async function test() {
  console.log(await read(path));
  const _read = memoize(read);
  for (let index = 0; index < 3; index++) {
    console.log(await _read(path));
  }
}

test();

/* test with default resolver (name + hash of args) */

async function test2() {
  console.log(await read(path));
  const _read = memoize(read, hash.MD5);
  for (let index = 0; index < 3; index++) {
    console.log(await _read(path));
  }
}

test2();

async function getRedis(
  host = '127.0.0.1',
  port = 6379,
  password: string | null = null,
  isCluster = false,
) {
  return new Promise((resolve, reject) => {
    let redis: any;
    if (isCluster) {
      redis = new IoRedis.Cluster(
        [
          {
            port: port,
            host: host,
          },
        ],
        {
          dnsLookup: (address, callback) => callback(null, address, null),
          redisOptions: {
            tls: {},
            password: password,
          },
        },
      );
    } else {
      redis = new IoRedis(port, host, {});
    }

    redis.on('connect', () => {
      console.log('connected');

      return resolve(redis);
    });
    redis.on('error', (err) => {
      console.log('connect fail');
      return reject(err);
    });
  });
}

/* test with redis cache as store */

async function test3() {
  console.log(await read(path));
  const redis: any = await getRedis('127.0.0.1', 6379);
  const cache = new Cache(
    redis.set.bind(redis),
    redis.get.bind(redis),
    redis.get.bind(redis),
  );
  // const cache = new Map();

  const key = 'key';
  const val = 'val';

  console.log('cache.set', await cache.set(key, val));
  console.log('cache.get', await cache.get(key));
  console.log('cache.has', await cache.has(key));
  const _read = memoize(read, hash.MD5, cache);
  for (let index = 0; index < 3; index++) {
    console.log(await _read(path));
  }
}
test3();

async function test4() {
  const redis: any = await getRedis('127.0.0.1', 6379);
  const cache = new Cache(
    redis.set.bind(redis),
    redis.get.bind(redis),
    redis.get.bind(redis),
  );

  const config = [hash.MD5, cache];
  class MyClass {
    @memoized(...config)
    async read(path) {
      return readFileSync(path);
    }

    @memoized(...config)
    get value() {
      return Math.random();
    }
  }

  const a = new MyClass();
  const b = new MyClass();

  const path = '/home/unmad/Projects/packages/tests/temp.txt';
  console.log(await a.read(path), await b.read(path));
  console.log(await a.value, await b.value);
}

test4();
