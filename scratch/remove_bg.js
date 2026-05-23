import fs from 'fs';
import { PNG } from 'pngjs';

const inputPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\8c01a5af-70f3-4c5f-b410-888ca5e047c9\\natural_shiba_egg_1779502659307.png';
const outputPath = 'E:\\AIPCORE HUB\\public\\assets\\egg_orange.png';

console.log('Reading:', inputPath);

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function () {
    let transparentCount = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;

        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];
        const a = this.data[idx + 3];

        // Smooth chroma-keying for black background
        // Pure black and very dark pixels are set to transparent.
        // We smooth the transition slightly to avoid jagged outlines.
        const maxVal = Math.max(r, g, b);
        if (maxVal < 15) {
          this.data[idx + 3] = 0;
          transparentCount++;
        } else if (maxVal < 35) {
          // Smooth blend
          const factor = (maxVal - 15) / (35 - 15);
          this.data[idx + 3] = Math.round(factor * a);
          transparentCount++;
        }
      }
    }

    console.log(`Processed ${this.width}x${this.height} image. Made ${transparentCount} pixels transparent.`);

    this.pack()
      .pipe(fs.createWriteStream(outputPath))
      .on('finish', () => {
        console.log('Success! Saved transparent puppy to:', outputPath);
      });
  })
  .on('error', (err) => {
    console.error('Error parsing PNG:', err);
  });
