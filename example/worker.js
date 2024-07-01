
const UniQManager = require("../src/index");
const uniQManager = new UniQManager({
  redisConfig: {
    host: "127.0.0.1",
    port: "6379"
  },
  options: {
    noOfWorkers: 2,
    finishedAge: 10,
    failedAge: 60,
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

// Start the workers and add data to the queue
function main() {
  uniQManager.startWorkers();
}

main();