const fs = require('fs');
const path = require('path');

const targetPath = 'C:/Users/hp/Downloads/TFC-FINAL-v2/tfc-final/src/data/ContentData.js';
let data = fs.readFileSync(targetPath, 'utf8');

const badIds = [
  '7x64e7ldG9g', '7yMX3OsPJdU', 'Hyb8F9sHXdo', 'Kf78eRfGXEo', 'MCCB3y4Sd1M',
  'MuAOic6QGdk', 'R-kl0S18MKk', 'R7mifEjdvZM', 'SBbxd4Xc5gU', 'T_Zb-VmiS8g',
  'WW3U54ZiuwA', 'Zz67SYA9yV4', 'aiigklosh-w', 'ct8mZ3SPXT8', 'ddvDOowl2Q0',
  'gVvYYsquVN4', 'iooRI0duaV4', 'mmlcWm6xAW0', 'oNEkZzYK3tQ', 'oft2kC6xQvw',
  'reLMMM_Mg0A', 'sXVbWkoCVaA', 'tUNqL5Jn5X8', 'taAoxiH9qns', 'uq8loI7SMhU',
  'zmOy0sqRfiU'
];

let removedCount = 0;

for (const id of badIds) {
  // Matches the exact line containing the bad ID. Example:
  //   _v('7x64e7ldG9g', '...', false, '...'),
  const regex = new RegExp(`^\\s*_v\\('${id}',.*\\),\\r?\\n`, 'gm');
  const initialLength = data.length;
  data = data.replace(regex, '');
  if (data.length < initialLength) {
    removedCount++;
  } else {
    // Try without the line break if it's the last item
    const regexEnd = new RegExp(`^\\s*_v\\('${id}',.*\\),?`, 'gm');
    const l2 = data.length;
    data = data.replace(regexEnd, '');
    if (data.length < l2) removedCount++;
  }
}

fs.writeFileSync(targetPath, data);

const remainingMatches = data.match(/_v\('/g);
const remainingCount = remainingMatches ? remainingMatches.length : 0;

console.log(`Successfully removed ${removedCount} non-TFC videos.`);
console.log(`Remaining videos in ContentData.js: ${remainingCount}`);
