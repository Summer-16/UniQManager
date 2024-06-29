
const CronJob = require('cron').CronJob;
const Worker = require('./worker');
const { nanoTime, pickNumberFromPrimes } = require('../helper/utils');
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

/**
 * The _onComplete function logs a message indicating the completion of a task along with additional
 * information.
 * @param taskName - The `taskName` parameter is a string that represents the name of the task that has
 * been completed.
 * @param info - The `info` parameter is a piece of information or data that provides details about the
 * completion of the task specified by `taskName`. It could be a status message, result, or any other
 * relevant information related to the task completion.
 */
function _onComplete(taskName, info) {
  // console.debug(`${taskName} completed, info: ${info}`); // enable for debugging
};

/**
 * The function `startPolling` asynchronously starts a polling process with a specified number of
 * workers and uses prime numbers to reduce collisions between workers.
 * @param callbacksMap - The `callbacksMap` parameter is an object that contains key-value pairs where
 * the key is a unique identifier for a specific callback function, and the value is the actual
 * callback function itself. This map is used to associate callback functions with their respective
 * identifiers so that they can be executed when certain events occur during
 * @param maxWorkers - The `maxWorkers` parameter specifies the maximum number of workers that can be
 * spawned for processing tasks concurrently. It helps in controlling the workload distribution and
 * resource utilization.
 */
async function startPolling(callbacksMap, maxWorkers) {
  try {
    const time = pickNumberFromPrimes(); // this will pick a random number from prime numbers, using prime helps to reduce the collision between the workers from different nodes or different instances (1st preventer)
    const worker = new Worker({ maxWorkers, callbacksMap });
    const taskName = `QueueWorkerSpawner-` + nanoTime();
    console.info(`${enums.packageName} - Starting worker polling with taskName: ${taskName} and time: ${time}`);
    createBackgroundTask(taskName, `*/${time} * * * * *`, {}, worker.spawn.bind(worker), _onComplete);
  }
  catch (ex) {
    console.error(`${enums.packageName} - Exception in starting worker polling`, ex);
  }
};

module.exports = startPolling;