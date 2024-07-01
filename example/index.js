
const UniQManager = require("../src/index");
const uniQManager = new UniQManager({
  redisConfig: {
    host: "127.0.0.1",
    port: "6379"
  },
  options: {
    noOfWorkers: 2,
    finishedAge: 150,
    failedAge: 300,
    debug: true,
    callbacksMap: {
      logProject: async (data) => {
        console.info("Running logProject callback");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.info(`Logging the current project data received from queue:`, data);
        return { data: { type: "Test" } };
      }
    }
  }
});

async function addDataToQueue() {
  const noOfQueue = 10, noOfData = 5;

  for (let i = 0; i < noOfQueue; i++) {
    for (let j = 0; j < noOfData; j++) {
      const result = await uniQManager.addToQ(`queue-no-${i}`, { "projectName": "Queue-" + i, "projectId": `${i}${j}` }, "logProject");
      console.info("Data added: ", result);
    }
  }
}

// Start the workers and add data to the queue
function main() {
  uniQManager.startWorkers();
  addDataToQueue();
}

main();