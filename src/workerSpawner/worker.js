
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

  constructor({ maxWorkers = enums.maxWorkerCount, callbacksMap = {} }) {
    this.isTaskRunning = false;
    this.maxWorkers = maxWorkers;
    this.currentWorkerCount = 0;
    this.callbacksMap = callbacksMap;
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
          const randomTime = getRandomNumberBetween(10, 50);
          await wait(randomTime * 10); // this random time wait in ms will help to prevent the race condition between the workers from different nodes or different instances which are trying to read the same queue (2nd preventer)
          const unLockedQueues = await getUnlockedQueue(taskName);

          if (unLockedQueues.length === 0) {
            // await new Promise((resolve) => setTimeout(resolve, 2000));
            releaseQueueReadingLock(taskName);
            console.log('Either no Queues are there or all are locked');
            return;
          } else {
            const iterations = Math.min(noOfWorkersToSpawn, unLockedQueues.length);
            console.log("Current worker count: ", this.currentWorkerCount, "Max worker count: ", this.maxWorkers, "No of workers to spawn: ", iterations);
            for (let i = 0; i < iterations; i++) {
              const queueName = unLockedQueues[i];
              this.currentWorkerCount = this.currentWorkerCount + 1;
              this.workerCallback(queueName)
                .then(async (result) => {
                  await removeQueueLock(queueName);
                  this.currentWorkerCount = this.currentWorkerCount - 1;
                  console.log("Job finished: ", queueName);
                })
                .catch(async (err) => {
                  await removeQueueLock(queueName);
                  this.currentWorkerCount = this.currentWorkerCount - 1;
                  console.log("Error in job: ", queueName);
                });
            }
            releaseQueueReadingLock(taskName);
          }
        }
      } else {
        console.log('Max worker count reached, will spawn new workers in next cycle');
      }

    } catch (error) {
      console.error(`Error in spawnWorkers: `, error);
    }
    finally {
      this.isTaskRunning = false;
      // console.info(`Task Ended...`);
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
        console.log("Data removed: ", result);

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
              await callback(payload);
              await updateJobStatus(result.jobId, 'Finished', 3600);
            }
            catch (error) {
              console.error('Error in callback: ', actionName, error);
              await updateJobStatus(result.jobId, 'Failed');
            }
          } else {
            console.log('No callback found for job: ', jobId, ' with action: ', actionName);
            await updateJobStatus(result.jobId, 'NoCallbackFound', 3600);
          }
        }
      }
      catch (error) {
        console.error('Error in workerCallback: ', error);
        throw new Error("Error in workerCallback");
      }
    }
  }

}

module.exports = Worker;