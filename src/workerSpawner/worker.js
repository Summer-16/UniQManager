
const enums = require('../helper/enums');
const {
  dequeue,
  getUnlockedQueue,
  updateJobStatus,
  updateQueueStatus,
  removeQueueLock,
  releaseQueueReadingLock
} = require('../queue');
const { getRandomNumberBetween, wait } = require('../helper/utils');

class Worker {

  constructor(options = {}) {
    this.isTaskRunning = false;
    this.maxWorkers = options.noOfWorkers || enums.maxWorkerCount;
    this.currentWorkerCount = 0;
    this.callbacksMap = options.callbacksMap || {};
    this.finishedAge = options.finishedAge || enums.finishedAge;
    this.failedAge = options.failedAge || enums.failedAge;
    this.debug = options.debug || false;
  }

  /**
   * The `spawn` function asynchronously spawns workers to process tasks while preventing race conditions
   * and managing worker counts.
   * @param taskName - The `taskName` parameter in the `spawn` method represents the name of the task for
   * which workers are being spawned. This task name is used to identify and process the specific task
   * within the worker spawning logic.
   * @returns If the `isTaskRunning` flag is true, the function will return early without executing the
   * rest of the code.
   */
  async spawn(taskName) {

    if (this.isTaskRunning) {
      return;
    }
    try {

      this.isTaskRunning = true;

      if (this.currentWorkerCount < this.maxWorkers) {
        const noOfWorkersToSpawn = this.maxWorkers - this.currentWorkerCount;

        if (noOfWorkersToSpawn > 0) {
          const randomTimeL = getRandomNumberBetween(10, 50);
          const randomTimeS = getRandomNumberBetween(1, 10);
          await wait(((randomTimeL * 10) + randomTimeS)); // this random time wait in ms will help to prevent the race condition between the workers from different nodes or different instances which are trying to read the same queue (2nd preventer)
          const unLockedQueues = await getUnlockedQueue(taskName);

          if (unLockedQueues.length === 0) {
            releaseQueueReadingLock(taskName);
            if (this.debug)
              console.info(`${enums.packageName} - No unlocked queues found, releasing lock and exiting...`);
            return;
          } else {
            const iterations = Math.min(noOfWorkersToSpawn, unLockedQueues.length);
            if (this.debug)
              console.info(`${enums.packageName} - Current worker count: ${this.currentWorkerCount}, Max worker count: ${this.maxWorkers}, No of workers to spawn: ${iterations}`);
            for (let i = 0; i < iterations; i++) {
              const queueName = unLockedQueues[i];
              this.currentWorkerCount = this.currentWorkerCount + 1;
              this.workerCallback(queueName)
                .then(async (result) => {
                  await removeQueueLock(queueName);
                  this.currentWorkerCount = this.currentWorkerCount - 1;
                  if (this.debug)
                    console.info(`${enums.packageName} - Worker completed job: ${queueName}`);
                })
                .catch(async (err) => {
                  await removeQueueLock(queueName);
                  this.currentWorkerCount = this.currentWorkerCount - 1;
                  console.error(`${enums.packageName} - Error in worker for queue: ${queueName}:`, err);
                });
            }
            releaseQueueReadingLock(taskName);
          }
        }
      } else {
        if (this.debug)
          console.info(`${enums.packageName} - Max worker count reached, exiting...`);
      }
    } catch (error) {
      console.error(`${enums.packageName} - Error in spawn: `, error);
    }
    finally {
      this.isTaskRunning = false;
    }
  }

  /**
   * The `workerCallback` function processes jobs from a queue, executes corresponding callbacks, and
   * updates job statuses accordingly.
   * @param queueName - The `workerCallback` function you provided seems to be processing jobs from a
   * queue. The `queueName` parameter is the name of the queue from which jobs will be dequeued and
   * processed. This function locks the queue, dequeues jobs one by one, processes them using callbacks
   * based on the action
   */
  async workerCallback(queueName) {
    await updateQueueStatus(queueName, 'Locked');

    while (true) {
      try {
        const result = await dequeue(queueName);
        console.info(`${enums.packageName} - Worker callback running for queue: ${queueName}`, result);

        if (result === null) {
          break;
        } else {
          const { jobId } = result;
          let data = result.data;
          data = JSON.parse(data);
          const { actionName, payload } = data;
          const callback = this.callbacksMap[actionName];
          if (callback) {
            try {
              const callbackRes = await callback(payload);
              await updateJobStatus(result.jobId, JSON.stringify({ status: 'Finished', result: callbackRes }), this.finishedAge);
            }
            catch (error) {
              console.error(`${enums.packageName} - Error in workerCallback for queue: ${queueName}: `, error);
              await updateJobStatus(result.jobId, JSON.stringify({ status: 'Failed', result: error.message }), this.failedAge);
            }
          } else {
            console.info(`${enums.packageName} - No callback found for queue: ${queueName}, action: ${actionName}`);
            await updateJobStatus(result.jobId, JSON.stringify({ status: 'NoCallbackFound', result: null }), this.finishedAge);
          }
        }
      }
      catch (error) {
        console.error(`${enums.packageName} - Error in workerCallback for queue: ${queueName}: `, error);
        throw new Error("Error in workerCallback");
      }
    }
  }

}

module.exports = Worker;