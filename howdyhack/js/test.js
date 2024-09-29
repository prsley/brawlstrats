// app.js
const util = require('util');
const { exec } = require('child_process');

// Promisify exec
const execPromisified = util.promisify(exec);

// Usage example
execPromisified('ls')
    .then(result => console.log(result.stdout))
    .catch(err => console.error(err));
