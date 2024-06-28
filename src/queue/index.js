const { getRedis } = require('../redis');
const enums = require('../helper/enums');
const { nanoTime } = require('../helper/utils');

async function enqueue(queueName, data) {
  const redis = getRedis();

  const score = nanoTime();
  const queueKey = `${enums.queueFolder}:${queueName}:queue`;
  const dataKey = `${enums.queueFolder}:${queueName}:${score}`;
  const queueKeyExists = await redis.exists(queueKey);
  let addQueueStatus = true;

  if (queueKeyExists) {
    addQueueStatus = false;
  }

  await redis.zadd(queueKey, score, dataKey);
  await redis.set(dataKey, (typeof data === 'object' ? JSON.stringify(data) : data));
  if (addQueueStatus) {
    await updateQueueStatus(queueName, 'noLock');
  }

  return { score, dataKey };
};

async function dequeue(queueName) {
  const redis = getRedis();

  const queueKey = `${enums.queueFolder}:${queueName}:queue`;
  const queueKeyExists = await redis.exists(queueKey);
  if (!queueKeyExists) {
    console.log('Queue does not exist');
    return null;
  }

  const elements = await redis.zrange(queueKey, 0, 0);
  if (elements.length === 0) {
    console.log('Queue is empty');
    return null;
  }

  const dataKey = elements[0];
  const data = await redis.get(dataKey);
  const jobId = dataKey.split(':')[2] + ":" + dataKey.split(':')[3];
  updateJobStatus(jobId, 'In-Progress', 3600);

  await redis.zrem(queueKey, dataKey);
  await redis.del(dataKey);

  return { jobId, data };
};

async function removeQueueLock(queueName) {
  const redis = getRedis();
  await redis.hdel(enums.queueStatusHash, queueName);
}

async function getUnlockedQueue() {
  const redis = getRedis();

  const queueStatuses = await redis.hgetall(enums.queueStatusHash);
  const unLockedQueues = [];
  for (const queueName in queueStatuses) {
    if (queueStatuses[queueName] === 'noLock') {
      unLockedQueues.push(queueName);
    }
  };
  return unLockedQueues;
};

async function updateJobStatus(jobName, status, exp = 86400) {
  const redis = getRedis();
  const redisKey = `${enums.jobStatusHash}:${jobName}`;
  await redis.set(redisKey, status);
  if (exp !== -1) {
    await redis.expire(redisKey, exp);
  }
};

async function getJobStatusById(jobId) {
  const redis = getRedis();
}

async function updateQueueStatus(queueName, status) {
  const redis = getRedis();
  await redis.hmset(enums.queueStatusHash, queueName, status);
};


module.exports = {
  enqueue,
  dequeue,
  getUnlockedQueue,
  updateJobStatus,
  updateQueueStatus,
  getJobStatusById,
  removeQueueLock
};
