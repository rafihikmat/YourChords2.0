
const fs = require('fs');

try {
    const data = fs.readFileSync('D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json', 'utf8');
    JSON.parse(data);
    console.log("JSON is valid");
} catch (e) {
    console.log("JSON is invalid");
    console.log(e.message);
    if (e.message.includes('position')) {
        const match = e.message.match(/position (\d+)/);
        if (match) {
            const pos = parseInt(match[1]);
            const start = Math.max(0, pos - 50);
            const end = Math.min(data.length, pos + 50);
            console.log("Context:");
            console.log(data.substring(start, end));
            console.log("Pointer:");
            console.log(" ".repeat(pos - start) + "^");
        }
    }
}
