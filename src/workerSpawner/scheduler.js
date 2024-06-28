
const CronJob = require('cron').CronJob;
const Worker = require('./worker');
const { getRedis } = require('../redis');
const enums = require('../helper/enums');

/**
 * @desc - Create the background task 
 * @param {string} taskName - Name of the Task
 * @param {string} time - Use the cron time format like * * * * * *
 * @param {object} info - Object that have the information that need to be pass in action function
 * @param {function} action - Function that will be called from task based on time
 * @param {function} onComplete - Function that will be called when task completed
 */
function createBackgroundTask(taskName, time, info, action, onComplete) {
  const task = new CronJob(time,
    function (callback) {
      const options = Object.assign({}, info);
      action(taskName, options);
    }, onComplete, true);
  task.start();
}

function _onComplete(taskName, info) {
  console.debug(`${taskName} completed, info: ${info}`);
};

async function getJobTime() {
  const smallestMultiple = Math.ceil(3 / 3) * 3;
  const largestMultiple = Math.floor(30 / 3) * 3;
  const randomMultiple = smallestMultiple + Math.floor(Math.random() * ((largestMultiple - smallestMultiple) / 3 + 1)) * 3;
  return randomMultiple;
}

async function startPolling(callbacksMap, maxWorkers) {
  try {
    const time = await getJobTime();
    const worker = new Worker({ maxWorkers, callbacksMap });
    createBackgroundTask(`Queue Jobs Worker Spawner`, `${time} * * * * *`, {}, worker.spawn.bind(worker), _onComplete);
  }
  catch (ex) {
    console.error("ex: ", ex);
  }
};

module.exports = startPolling;