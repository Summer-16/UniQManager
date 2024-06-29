
const Redis = require("ioredis");
let redis = null;

/**
 * The function `initRedis` initializes a Redis connection using the provided properties such as host,
 * port, username, and password.
 * @param props - The `props` parameter in the `initRedis` function likely contains the configuration
 * details needed to connect to a Redis database. These details include:
 * @returns The function `initRedis` is returning an instance of Redis with the provided configuration
 * properties such as host, port, username, and password.
 */
function initRedis(props) {
  const { host, port, username, password } = props;
  const redisConfig = { host, port };
  if (username) {
    redisConfig.username = username;
  }
  if (password) {
    redisConfig.password = password;
  }

  redis = new Redis(redisConfig);
  return redis;
}

/**
 * The function `getRedis` returns the `redis` object.
 * @returns The function `getRedis()` is returning the `redis` object.
 */
function getRedis() {
  return redis;
}

module.exports = { initRedis, getRedis };