
const queueName = "UniQManager";

/* This code snippet is defining an object named `enums` that contains various key-value pairs. Each
key represents a specific constant related to a queue management system, and the corresponding value
is derived from the `queueName` constant. */
const enums = {
  queueDB: queueName,
  queueFolder: `${queueName}:queues`,
  queueStatusHash: `${queueName}:queueStatus`,
  jobStatusHash: `${queueName}:jobStatus`,
  workerSpawnerTime: `${queueName}:workerSpawnerTime`,
  queueReadingLock: `${queueName}:queueReadingLock`,
  maxWorkerCount: 5,
};

module.exports = enums;