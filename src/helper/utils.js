
/**
 * The `nanoTime` function returns the current high-resolution real time in nanoseconds.
 * @returns The `nanoTime` function returns the current high-resolution real time in nanoseconds as a
 * BigInt value using `process.hrtime.bigint()` function.
 */
function nanoTime() {
  return process.hrtime.bigint();
}

/**
 * The function getLastDigitOfHrtime retrieves the last digit of the current high-resolution real time
 * in JavaScript.
 * @returns The function `getLastDigitOfHrtime` returns the last digit of the current high-resolution
 * real time in nanoseconds.
 */
function getLastDigitOfHrtime() {
  const hrtimeBigInt = process.hrtime.bigint();
  const lastDigit = hrtimeBigInt % 10n; // Get the remainder when divided by 10 to get the last digit
  return Number(lastDigit);
}

/**
 * The function getRandomNumberBetween generates a random integer between a specified minimum and
 * maximum value, inclusive.
 * @param [min=1] - The `min` parameter in the `getRandomNumberBetween` function represents the minimum
 * value that the random number can be. If no value is provided for `min`, it defaults to 1.
 * @param [max=10] - The `max` parameter in the `getRandomNumberBetween` function represents the
 * maximum value that the random number generated should not exceed. By default, if no `max` value is
 * provided when calling the function, it will default to 10.
 * @returns The function getRandomNumberBetween(min, max) returns a random integer between the
 * specified minimum (min) and maximum (max) values, inclusive.
 */
function getRandomNumberBetween(min = 1, max = 10) {
  if (min > max) {
    throw new Error('Min should be less than or equal to Max');
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * The function `pickNumberFromPrimes` selects a prime number from a predefined list based on the
 * current epoch time in seconds.
 * @returns The function `pickNumberFromPrimes` returns a prime number from the `primes` array based on
 * the current epoch time in seconds.
 */
function pickNumberFromPrimes() {
  const primes = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];
  const currentTime = Math.floor(Date.now() / 1000); // Current epoch time in seconds
  const index = currentTime % primes.length; // Using modulo to pick index based on current time
  return primes[index];
}

/**
 * The `wait` function returns a promise that resolves after a specified number of milliseconds.
 * @param ms - The `ms` parameter in the `wait` function represents the number of milliseconds to wait
 * before resolving the promise.
 * @returns The `wait` function is returning a Promise.
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  nanoTime,
  getLastDigitOfHrtime,
  getRandomNumberBetween,
  pickNumberFromPrimes,
  wait
};