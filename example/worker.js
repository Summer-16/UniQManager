
const UniQManager = require("../src/index");
const uniQManager = new UniQManager({
  redisConfig: {
    host: "127.0.0.1",
    port: "6379"
  },
  callbacksMap: {
    logProject: async (data) => {
      console.log("Running logProject callback");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log(`Logging the current project data received from queue:`, data);
    }
  }
});

// Start the workers and add data to the queue
function main() {
  uniQManager.startWorkers(5);
}

main();