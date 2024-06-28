
const enums = require('../helper/enums');
const {
  dequeue,
  getUnlockedQueue,
  updateJobStatus,
  updateQueueStatus,
  removeQueueLock
} = require('../queue');

class Worker {

  constructor({ maxWorkers = enums.maxWorkerCount, callbacksMap = {} }) {
    this.isTaskRunning = false;
    this.maxWorkers = maxWorkers;
    this.currentWorkerCount = 0;
    this.callbacksMap = callbacksMap;
  }

  async spawn(taskName) {

    if (this.isTaskRunning) {
      return;
    }
    try {

      this.isTaskRunning = true;

      if (this.currentWorkerCount < this.maxWorkers) {
        const noOfWorkersToSpawn = this.maxWorkers - this.currentWorkerCount;
        const unLockedQueues = await getUnlockedQueue();

        if (unLockedQueues.length === 0) {
          // console.log('Either no Queues are there or all are locked');
          return;
        } else {
          const iterations = Math.min(noOfWorkersToSpawn, unLockedQueues.length);
          console.log("Current worker count: ", this.currentWorkerCount, "Max worker count: ", this.maxWorkers, "No of workers to spawn: ", iterations);
          for (let i = 0; i < iterations; i++) {
            const queueName = unLockedQueues[i];
            this.currentWorkerCount = this.currentWorkerCount + 1;
            this.workerCallback(queueName)
              .then(async (result) => {
                this.currentWorkerCount = this.currentWorkerCount - 1;
                console.log("Job finished: ", queueName);
                await removeQueueLock(queueName);
              })
              .catch(async (err) => {
                this.currentWorkerCount = this.currentWorkerCount - 1;
                console.log("Error in job: ", queueName);
              });
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

  async workerCallback(queueName) {
    await updateQueueStatus(queueName, 'Locked');

    while (true) {
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
            await updateJobStatus(result.jobId, 'Finished', 60 * 5);
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
  }

}

module.exports = Worker;