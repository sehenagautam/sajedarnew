import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const inputPath = path.resolve('public/logo.png');
const outputPath = path.resolve('public/logo-transparent.png');

function isNearWhite(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 235 && max - min < 22;
}

async function cleanLogo() {
  await fs.access(inputPath);

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const queue = [];
  const visited = new Uint8Array(width * height);

  function indexFor(x, y) {
    return y * width + x;
  }

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const index = indexFor(x, y);
    if (visited[index]) {
      return;
    }

    const offset = index * channels;
    if (isNearWhite(data[offset], data[offset + 1], data[offset + 2])) {
      visited[index] = 1;
      queue.push([x, y]);
    }
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    const index = indexFor(x, y);
    const offset = index * channels;
    data[offset + 3] = 0;

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log(`Transparent logo written to ${outputPath}`);
}

cleanLogo().catch((error) => {
  console.error(error);
  process.exit(1);
});
