# UniQManager

UniQManager is a Node.js library for managing queues with Redis. It supports adding data to queues, starting worker processes to handle the queued data, and checking the status of jobs.

One unique feature is it support one worker per queue, globally withing multiple instances of nodejs server. This is useful when you want to process data in a queue in a sequential manner.

## Installation

To install the UniQManager package, use npm:

```bash
npm install uniqmanager
```

## Usage

### Initialization

To use UniQManager, first, import it and initialize it with your Redis configuration and options.

```javascript
const UniQManager = require('uniqmanager');

const uniQManager = new UniQManager({
  redisConfig: {
    host: '127.0.0.1',
    port: '6379'
  },
  options: {
    maxWorkers: 5,
    finishedAge: 10000,
    failedAge: 60000,
    debug: true,
    callbacksMap: {
      logProject: async (data) => {
        console.log('Running logProject callback');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log('Logging the current project data received from queue:', data);
      }
    }
  }
});
```

### Options
`redisConfig`: The Redis configuration object containing the host and port. It also supports username and password.
`options`: The options object containing the following properties:
- `maxWorkers`: The maximum number of workers to start.
- `finishedAge`: The time in milliseconds to keep finished jobs in the database.
- `failedAge`: The time in milliseconds to keep failed jobs in the database.
- `debug`: A boolean value to enable or disable debug mode.
- `callbacksMap`: An object containing the action names and their corresponding callback functions.

### Callbacks
The `callbacksMap` object contains the action names and their corresponding callback functions. The callback functions are asynchronous and take the data as an argument.
Its important to note that the callback function should be defined before adding data to the queue. and the action name should be the same as the one used when adding data to the queue.

```javascript
callbacksMap: {
  logProject: async (data) => {
    console.log('Running logProject callback');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Logging the current project data received from queue:', data);
  }
}
```


### Adding Data to a Queue

You can add data to a queue using the `addToQ` method. This method takes the queue name, the data to add, and the action name.

```javascript
async function addDataToQueue() {
  const noOfQueue = 5;
  const noOfData = 10;

  for (let i = 0; i < noOfQueue; i++) {
    for (let j = 0; j < noOfData; j++) {
      const result = await uniQManager.addToQ(`queue-no-${i}`, { projectName: 'Queue-' + i, projectId: `${i}${j}` }, 'logProject');
      console.log('Data added:', result);
    }
  }
}
```

### Starting Worker Processes

Start worker processes to handle the queued data using the `startWorkers` method. You can specify the number of workers.

```javascript
function main() {
  uniQManager.startWorkers(5);
  addDataToQueue();
}

main();
```

### Getting Job Status

You can check the status of a job using the `getJobStatus` method.

```javascript
async function checkJobStatus(jobId) {
  const status = await uniQManager.getJobStatus(jobId);
  console.log('Job status:', status);
}
```

## API

### UniQManager Class

#### Constructor

```javascript
new UniQManager(props);
```

- `props`: An object containing `redisConfig` and `options`.

#### Methods

- `addToQ(queueName, data, action)`: Adds data to a specified queue.
  - `queueName`: The name of the queue.
  - `data`: The data to add to the queue.
  - `action`: The action name.

- `startWorkers()`: Starts worker processes.

- `getJobStatus(jobId)`: Retrieves the status of a job by its ID.
  - `jobId`: The job ID.

## Example

Here's a complete example to illustrate how to use UniQManager:

```javascript
const UniQManager = require('uniqmanager');

const uniQManager = new UniQManager({
  redisConfig: {
    host: '127.0.0.1',
    port: '6379'
  },
  options: {
    maxWorkers: 5,
    finishedAge: 10000,
    failedAge: 60000,
    debug: true,
    callbacksMap: {
      logProject: async (data) => {
        console.log('Running logProject callback');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log('Logging the current project data received from queue:', data);
      }
    }
  }
});

async function addDataToQueue() {
  const noOfQueue = 5;
  const noOfData = 10;

  for (let i = 0; i < noOfQueue; i++) {
    for (let j = 0; j < noOfData; j++) {
      const result = await uniQManager.addToQ(`queue-no-${i}`, { projectName: 'Queue-' + i, projectId: `${i}${j}` }, 'logProject');
      console.log('Data added:', result);
    }
  }
}

function main() {
  uniQManager.startWorkers(5);
  addDataToQueue();
}

main();
```

## License

This project is licensed under the MIT License.