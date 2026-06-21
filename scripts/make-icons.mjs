// Generate the PWA / home-screen icons (drawn as flat rectangles — no image deps beyond pngjs).
// A blue tile with three "text lines" and two black redaction bars = the blackout-reading vibe.
import { PNG } from 'pngjs'
import { mkdirSync, writeFileSync } from 'node:fs'

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const BG = rgb('#6c8cff')
const WHITE = rgb('#ffffff')
const BLACK = rgb('#0b0d16')

// Design coordinates are on a 512 grid; scaled to each output size.
const LINES = [
  [96, 150, 200, 40, WHITE],
  [312, 150, 104, 40, BLACK],
  [96, 236, 320, 40, WHITE],
  [96, 322, 150, 40, BLACK],
  [262, 322, 154, 40, WHITE],
]

function makeIcon(size) {
  const png = new PNG({ width: size, height: size })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = BG[0]
    png.data[i + 1] = BG[1]
    png.data[i + 2] = BG[2]
    png.data[i + 3] = 255
  }
  const s = size / 512
  for (const [x, y, w, h, col] of LINES) {
    for (let yy = Math.round(y * s); yy < Math.round((y + h) * s); yy++) {
      for (let xx = Math.round(x * s); xx < Math.round((x + w) * s); xx++) {
        if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue
        const idx = (size * yy + xx) << 2
        png.data[idx] = col[0]
        png.data[idx + 1] = col[1]
        png.data[idx + 2] = col[2]
        png.data[idx + 3] = 255
      }
    }
  }
  return png
}

mkdirSync(new URL('../public/', import.meta.url), { recursive: true })
for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `pwa-${size}.png`
  writeFileSync(new URL(`../public/${name}`, import.meta.url), PNG.sync.write(makeIcon(size)))
  console.log('wrote public/' + name)
}
