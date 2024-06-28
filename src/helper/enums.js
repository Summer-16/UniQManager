
const queueName = "UniQManager";

const enums = {
  queueDB: queueName,
  queueFolder: `${queueName}:queues`,
  queueStatusHash: `${queueName}:queueStatus`,
  jobStatusHash: `${queueName}:jobStatus`,
  workerSpawnerTime: `${queueName}:workerSpawnerTime`,
  maxWorkerCount: 5,
};

module.exports = enums;