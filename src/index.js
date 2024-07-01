
const { initRedis } = require('./redis');
const {
  enqueue,
  getJobStatusById,
  updateQueueStatus
} = require('./queue');
const startPolling = require('./workerSpawner/scheduler');

/* The UniQManager class manages a queue system by adding data to a queue, starting worker processes,
and checking job statuses. */
class UniQManager {

  constructor(props) {
    const { redisConfig, options } = props;
    this.options = options;
    try {
      this.redis = initRedis(redisConfig);
    } catch (error) {
      throw new Error(`Failed to initialize Redis: ${error.message}`);
    }
    updateQueueStatus('uniQManager', 'Running');
  }

  /**
   * The function addToQ asynchronously adds data to a queue and returns the queue name along with the
   * result score.
   * @param queueName - The `queueName` parameter is a string that represents the name of the queue where
   * the data will be added.
   * @param data - The `data` parameter in the `addToQ` function represents the information or payload
   * that you want to add to the specified queue. It could be any data that you want to process or store
   * in the queue.
   * @param action - The `action` parameter in the `addToQ` function represents the name of the action
   * being performed. It is used to create the `finalData` object with the action name and the payload
   * data before enqueuing it in the specified queue.
   * @returns The function `addToQ` is returning a string in the format `:${result.score}`.
   */
  async addToQ(queueName, data, action) {
    const finalData = {
      actionName: action,
      payload: data
    };
    const result = await enqueue(queueName, finalData);
    return `${queueName}:${result.score}`;
  }

  /**
   * The `startWorkers` function calls the `startPolling` function with the provided options.
   */
  startWorkers() {
    startPolling(this.options);
  }

  /**
   * The function `getJobStatus` asynchronously retrieves the status of a job using its ID.
   * @param jobId - The `jobId` parameter is a unique identifier for a job. It is used to retrieve the
   * status of a specific job by passing it to the `getJobStatusById` function asynchronously.
   * @returns The `getJobStatus` function is returning the result of the `getJobStatusById` function when
   * called with the `jobId` parameter.
   */
  async getJobStatus(jobId) {
    return await getJobStatusById(jobId);
  }
}

module.exports = UniQManager;