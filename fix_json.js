
const fs = require('fs');
const filePath = 'D:/WebsiteBaru/YourChords2.0/lib/data/guitar.json';

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Construct the bad segment we want to find. 
    // We know the values in fingers array: 0, 2, 1, 0, 0, 3
    // We'll look for that pattern.
    
    const fingersPattern = /"fingers":\s*\[\s*0,\s*2,\s*1,\s*0,\s*0,\s*3\s*\]\s*,/;
    const match = content.match(fingersPattern);
    
    if (match) {
        console.log("Found fingers pattern at index " + match.index);
        
        // The next part should be baseFret: 11
        const nextPartStart = match.index + match[0].length;
        const nextPart = content.substring(nextPartStart, nextPartStart + 200);
        console.log("Next 200 chars (hex):");
        console.log(Buffer.from(nextPart).toString('hex'));
        
        // We will just replace from the end of fingers array up to the start of midi array content
        // We expect: "baseFret": 11, "barres": [], "midi": [
        
        // Let's find the start of the midi array content "57,"
        const midiContentStart = content.indexOf('57,', nextPartStart);
        
        if (midiContentStart !== -1) {
            console.log("Found midi content start at " + midiContentStart);
            
            // Construct the correct string
            const correctString = `
                    "baseFret": 11,
                    "barres": [],
                    "midi": [
                        `;
            
            // Replace everything between match end and midiContentStart
            const newContent = content.substring(0, nextPartStart) + correctString + content.substring(midiContentStart);
            
            fs.writeFileSync(filePath, newContent);
            console.log("Fixed file!");
        } else {
            console.log("Could not find midi content start '57,'");
        }
        
    } else {
        console.log("Could not find fingers pattern");
    }
    
} catch (e) {
    console.error(e);
}
