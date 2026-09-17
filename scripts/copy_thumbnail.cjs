const fs = require('fs');

const srcPath = 'C:/Users/Admin/.gemini/antigravity-ide/brain/8ea725d7-191d-419f-8a4c-28265160c78d/.user_uploaded/media_1789613630161.png';
const destPath = 'd:/QuangDung/QuangDung/japanese-study-hub/public/img/record-thumbnail.jpg';

fs.copyFileSync(srcPath, destPath);
console.log('File copied successfully.');
