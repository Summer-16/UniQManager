

// Function to get the current time in nanoseconds
function nanoTime() {
  return process.hrtime.bigint();
}


module.exports = {
  nanoTime
};