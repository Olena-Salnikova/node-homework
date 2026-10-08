const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log('Platform:', os.platform());
console.log('CPU:', os.cpus()[0].model);
console.log('Total Memory:', os.totalmem());

// Path module
const joinedPath = path.join(sampleFilesDir, 'folder', 'file.txt');
console.log('Joined path:', joinedPath);

// fs.promises API
async function demoFsPromises() {
  const filePath = path.join(sampleFilesDir, 'demo.txt');

  await fs.promises.writeFile(filePath, 'Hello from fs.promises!');

  const data = await fs.promises.readFile(filePath, 'utf8');
  console.log('fs.promises read:', data);
}

// Streams for large files- log first 40 chars of each chunk
const largeFilePath = path.join(sampleFilesDir, 'largefile.txt');
const lines = [];

for (let i = 1; i <= 100; i++) {
  lines.push(`This is line ${i} in a large file.`);
}

fs.writeFileSync(largeFilePath, lines.join('\n'));


const readStream = fs.createReadStream(largeFilePath, {
  highWaterMark: 1024,
});

readStream.on('data', (chunk) => {
  console.log('Read chunk:', chunk.toString().slice(0, 40));
});

readStream.on('end', () => {
  console.log('Finished reading large file with streams.');
});

demoFsPromises();
