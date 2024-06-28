
const { initRedis } = require('./redis');
const {
  enqueue,
  getJobStatusById,
  updateQueueStatus
} = require('./queue');
const startPolling = require('./workerSpawner/scheduler');

class UniQManager {

  constructor(props) {
    const { redisConfig, callbacksMap } = props;
    this.callbacksMap = callbacksMap;
    try {
      this.redis = initRedis(redisConfig);
    } catch (error) {
      throw new Error(`Failed to initialize Redis: ${error.message}`);
    }
    updateQueueStatus('uniQManager', 'Running');
  }

  async addToQ(queueName, data, action) {
    const finalData = {
      actionName: action,
      payload: data
    };
    const result = await enqueue(queueName, finalData);
    return `${queueName}:${result.score}`;
  }

  startWorkers(noOfWorkers) {
    startPolling(this.callbacksMap, noOfWorkers);
  }

  async getJobStatus(jobId) {
    return await getJobStatusById(jobId);
  }
}

module.exports = UniQManager;