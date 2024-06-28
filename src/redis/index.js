
const Redis = require("ioredis");
let redis = null;

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

function getRedis() {
  return redis;
}

module.exports = { initRedis, getRedis };