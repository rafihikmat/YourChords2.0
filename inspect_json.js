
const fs = require('fs');
const filePath = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json';
const pos = 1833757;
const start = Math.max(0, pos - 100);
const length = 200;

const buffer = Buffer.alloc(length);
const fd = fs.openSync(filePath, 'r');
fs.readSync(fd, buffer, 0, length, start);
fs.closeSync(fd);

console.log("Content around position " + pos + ":");
console.log(buffer.toString('utf8'));
console.log("\nHex:");
console.log(buffer.toString('hex'));
