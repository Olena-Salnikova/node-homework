const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration
const filePath = path.join(__dirname, 'sample-files', 'sample.txt');

async function createSampleFile() {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, 'Hello, async world!');
}

// 1. Callback style
function readFileCallback() {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Callback:', data);
      resolve();
    });
  });
}

// Callback hell example (test and leave it in comments):
/*
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) return console.error(err);

  fs.readFile(filePath, 'utf8', (err, data2) => {
    if (err) return console.error(err);

    fs.readFile(filePath, 'utf8', (err, data3) => {
      if (err) return console.error(err);

      console.log(data);
      console.log(data2);
      console.log(data3);
    });
  });
});
*/

// 2. Promise style
function readFilePromise() {
  return fs.promises.readFile(filePath, 'utf8')
    .then((data) => {
      console.log('Promise:', data);
    })
    .catch((err) => {
      console.error(err);
    });
}

// 3. Async/Await style
async function readFileAsync() {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    console.log('Async/Await:', data);
  } catch (err) {
    console.error(err);
  }
}

async function main() {
  await createSampleFile();
  await readFileCallback();
  await readFilePromise();
  await readFileAsync();
}

main();
