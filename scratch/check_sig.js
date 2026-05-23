import fs from 'fs';

const files = [
  'C:\\Users\\user\\.gemini\\antigravity\\brain\\8c01a5af-70f3-4c5f-b410-888ca5e047c9\\natural_shiba_egg_1779502659307.png',
  'C:\\Users\\user\\.gemini\\antigravity\\brain\\8c01a5af-70f3-4c5f-b410-888ca5e047c9\\shiba_inu_egg_transparent_1779502687337.png',
];

files.forEach(file => {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    console.log(file, buf.toString('hex'));
  } catch (e) {
    console.error(file, e.message);
  }
});
