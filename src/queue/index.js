const { getRedis } = require('../redis');
const enums = require('../helper/enums');
const { nanoTime } = require('../helper/utils');

/**
 * The function `enqueue` adds data to a Redis queue with a unique score and key.
 * @param queueName - The `queueName` parameter is the name of the queue where you want to enqueue the
 * data.
 * @param data - The `data` parameter in the `enqueue` function represents the information that you
 * want to add to the queue. It can be either a string or an object. If it's an object, it will be
 * stringified using `JSON.stringify` before being stored in the queue.
 * @returns The function `enqueue` returns an object with two properties: `score` and `dataKey`.
 */
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

/**
 * The function dequeues an element from a Redis queue, updates the job status, and returns the job ID
 * and data.
 * @param queueName - The `queueName` parameter is the name of the queue from which you want to dequeue
 * an element.
 * @returns The function `dequeue` returns an object with properties `jobId` and `data`.
 */
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

/**
 * The function `removeQueueLock` removes a lock on a queue in Redis.
 * @param queueName - The `queueName` parameter is a string that represents the name of the queue for
 * which you want to remove the lock.
 */
async function removeQueueLock(queueName) {
  const redis = getRedis();
  await redis.hdel(enums.queueStatusHash, queueName);
}

/**
 * The function `getUnlockedQueue` checks for a lock before reading a queue and returns a list of
 * unlocked queues if no lock is present.
 * @param spawner - The `spawner` parameter in the `getUnlockedQueue` function represents the
 * identifier of the worker or process that is attempting to read the queue. This identifier is used to
 * set a lock in Redis to ensure that only one worker can read the queue at a time, preventing race
 * conditions.
 * @returns The function `getUnlockedQueue` returns an array of unlocked queue names (`unLockedQueues`)
 * if there is no queue reading lock set in Redis. If a queue reading lock is set, an empty array is
 * returned.
 */
async function getUnlockedQueue(spawner) {
  const redis = getRedis();

  const queueReadingLock = await redis.get(enums.queueReadingLock); // lock for reading the queue, only one worker can read the queue at a time to prevent race condition (3rd preventer)
  if (queueReadingLock === null || queueReadingLock === 'null' || queueReadingLock === '' || queueReadingLock === undefined) {
    await redis.set(enums.queueReadingLock, spawner);
    const queueStatuses = await redis.hgetall(enums.queueStatusHash);
    const unLockedQueues = [];
    for (const queueName in queueStatuses) {
      if (queueStatuses[queueName] === 'noLock') {
        unLockedQueues.push(queueName);
      }
    };
    return unLockedQueues;
  } else {
    return [];
  }
};

/**
 * The function `releaseQueueReadingLock` releases a lock on a queue using Redis.
 */
async function releaseQueueReadingLock() {
  const redis = getRedis();
  await redis.set(enums.queueReadingLock, null);
}

/**
 * This async function updates the status of a job in Redis with an optional expiration time.
 * @param jobName - The `jobName` parameter is a string that represents the name of a job whose status
 * needs to be updated in a Redis database.
 * @param status - The `status` parameter in the `updateJobStatus` function represents the new status
 * that you want to set for a specific job. It could be a string indicating the current status of the
 * job, such as "pending", "in progress", "completed", etc.
 * @param [exp=86400] - The `exp` parameter in the `updateJobStatus` function represents the expiration
 * time in seconds for the job status stored in Redis. By default, it is set to 86400 seconds (24
 * hours). If you pass `-1` as the value for `exp`, it means that the job
 */
async function updateJobStatus(jobName, status, exp = 86400) {
  const redis = getRedis();
  const redisKey = `${enums.jobStatusHash}:${jobName}`;
  await redis.set(redisKey, status);
  if (exp !== -1) {
    await redis.expire(redisKey, exp);
  }
};

/**
 * The function `getJobStatusById` retrieves the status of a job by its ID from a Redis database.
 * @param jobId - The `jobId` parameter is the unique identifier of a job for which you want to
 * retrieve the status.
 * @returns The `getJobStatusById` function returns the status of a job with the specified `jobId` by
 * retrieving it from Redis using the key `${enums.jobStatusHash}:`. The status is fetched
 * asynchronously using `await redis.get(redisKey)` and then returned by the function.
 */
async function getJobStatusById(jobId) {
  const redis = getRedis();
  const redisKey = `${enums.jobStatusHash}:${jobId}`;
  const status = await redis.get(redisKey);
  return status;
}

/**
 * The function `updateQueueStatus` updates the status of a queue in Redis.
 * @param queueName - The `queueName` parameter is a string that represents the name of the queue whose
 * status you want to update in the Redis database.
 * @param status - The `status` parameter in the `updateQueueStatus` function represents the new status
 * that you want to set for a specific queue. It could be a string indicating the current state of the
 * queue, such as "active", "paused", "completed", or any other status you want to track for
 */
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
  removeQueueLock,
  releaseQueueReadingLock
};
