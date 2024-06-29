
const UniQManager = require("../src/index");
const uniQManager = new UniQManager({
  redisConfig: {
    host: "127.0.0.1",
    port: "6379"
  },
  options: {
    maxWorkers: 5,
    finishedAge: 10000,
    failedAge: 60000,
    debug: true,
    callbacksMap: {
      logProject: async (data) => {
        console.log("Running logProject callback");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(`Logging the current project data received from queue:`, data);
      }
    }
  }
});

async function addDataToQueue() {
  const noOfQueue = 5, noOfData = 10;

  for (let i = 0; i < noOfQueue; i++) {
    for (let j = 0; j < noOfData; j++) {
      const result = await uniQManager.addToQ(`queue-no-${i}`, { "projectName": "Queue-" + i, "projectId": `${i}${j}` }, "logProject");
      console.log("Data added: ", result);
    }
  }
}

// Start the workers and add data to the queue
function main() {
  uniQManager.startWorkers();
  addDataToQueue();
}

main();