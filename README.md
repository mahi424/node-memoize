# Memoize Functions

## Installation

```bash
npm install node-memoize --save
```

## Usage

```js
const hash = require('object-hash');
const IoRedis = require('ioredis');

const { Cache } = require('./build/src/Cache');
const { default: memoize } = require('./build/src/memoize');

async function sampleAsync(wait, ...args) {
  return new Promise((resolve) =>
    setTimeout(() => {
      return resolve(wait, args);
    }, wait),
  );
}

/* test with default resolver (name + first args) */
async function test() {
  console.log(await sampleAsync(100, 'a', 'b', 100));
  const _sampleAsync = memoize(sampleAsync);
  for (let index = 0; index < 3; index++) {
    console.log(await _sampleAsync(100, 'a', 'b', 100));
  }
}

test();

/* test with default resolver (name + hash of args) */

async function test2() {
  console.log(await sampleAsync(100, 'a', 'b', 100));
  const _sampleAsync = memoize(sampleAsync, hash.MD5);
  for (let index = 0; index < 3; index++) {
    console.log(await _sampleAsync(100, 'a', 'b', 100));
  }
}

test2();

async function getRedis(
  host = '127.0.0.1',
  port = 6379,
  password = null,
  isCluster = false,
) {
  return new Promise((resolve, reject) => {
    let redis;
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

async function testCache(cache) {
  const key = 'key';
  const val = 'val';
  console.log('cache.set', await cache.set(key, val));
  console.log('cache.get', await cache.get(key));
  console.log('cache.has', await cache.has(key));
}

async function test3() {
  // console.log(await sampleAsync(100, 'a', 'b', 100));
  const redis = await getRedis('127.0.0.1', 6379);
  const cache = new Cache(
    redis.set.bind(redis),
    redis.get.bind(redis),
    redis.get.bind(redis),
  );

  // even a map can be used as a store
  // any data structure that support ICache interface are valid
  // const cache = new Map();

  // uncomment below to test your cache function
  // await testCache(cache);
  const _sampleAsync = memoize(sampleAsync, hash.MD5, cache);
  for (let index = 0; index < 3; index++) {
    console.time(index);
    console.log(await _sampleAsync(100, 'a', 'b', 100));
    console.timeEnd(index);
  }
}

test3();
```
