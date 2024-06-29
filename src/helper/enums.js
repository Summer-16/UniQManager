
const packageName = "UniQManager";

/* This code snippet is defining an object named `enums` that contains various key-value pairs. Each
key represents a specific constant related to a queue management system, and the corresponding value
is derived from the `packageName` constant. */
const enums = {
  packageName,
  queueDB: packageName,
  queueFolder: `${packageName}:queues`,
  queueStatusHash: `${packageName}:queueStatus`,
  jobStatusHash: `${packageName}:jobStatus`,
  workerSpawnerTime: `${packageName}:workerSpawnerTime`,
  queueReadingLock: `${packageName}:queueReadingLock`,
  maxWorkerCount: 5,
  defaultFinishedAge: 3600,
  defaultFailedAge: 86400,
};

module.exports = enums;