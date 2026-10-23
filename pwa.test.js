const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

describe('iPhone standalone app', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const modern = read('modern.html');
  const entry = read('index.html');
  const style = read('modern.css');
  const sw = read('service-worker.js');

  test('iOS entry and calculator both advertise their own pink touch icon', () => {
    for (const html of [modern, entry]) {
      expect(html).toMatch(/rel="apple-touch-icon"[^>]*pink-touch-icon\.png/);
      expect(html).toMatch(/name="apple-mobile-web-app-capable" content="yes"/);
      expect(html).toMatch(/name="apple-mobile-web-app-title" content="Pink Calc"/);
      expect(html).toMatch(/rel="manifest"/);
    }
    expect(modern).toMatch(/viewport-fit=cover/);
    expect(manifest.start_url).toBe('./modern.html');
    expect(manifest.display).toBe('standalone');
    expect(manifest.short_name).toBe('Pink Calc');
  });

  test.each([
    ['Assets/pink-touch-icon.png', 180],
    ['Assets/pink-icon-192.png', 192],
    ['Assets/pink-icon-512.png', 512]
  ])('%s is a valid PNG of the requested size', (name, dimension) => {
    const png = fs.readFileSync(path.join(__dirname, name));
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(dimension);
    expect(png.readUInt32BE(20)).toBe(dimension);
    expect(png[24]).toBe(4); // indexed palette, 4 bits per pixel
    expect(png[25]).toBe(3);
    let pos = 8;
    const idat = [];
    while (pos < png.length) {
      const len = png.readUInt32BE(pos);
      const chunk = png.toString('ascii', pos + 4, pos + 8);
      if (chunk === 'IDAT') idat.push(png.subarray(pos + 8, pos + 8 + len));
      pos += 12 + len;
    }
    expect(idat.length).toBeGreaterThan(0);
    const decompressed = zlib.inflateSync(Buffer.concat(idat));
    expect(decompressed.length).toBe(dimension * (Math.ceil(dimension / 2) + 1));
  });

  test('manifest and offline cache reference the new pink icons', () => {
    expect(manifest.icons.map(x => x.src)).toEqual(expect.arrayContaining([
      'Assets/pink-icon-192.png',
      'Assets/pink-icon-512.png'
    ]));
    for (const asset of ['pink-touch-icon.png','pink-icon-192.png','pink-icon-512.png']) {
      expect(sw).toContain(asset);
    }
    expect(sw).toContain('modern-v3-iphone');
  });

  test('mobile register details are accessible, expandable and do not crowd the keys', () => {
    expect(modern).toMatch(/id="register-toggle"[^>]*aria-expanded="false"/);
    expect(modern).toContain('id="register-grid"');
    expect(style).toMatch(/@media \(max-width: 599px\)/);
    expect(style).toContain('safe-area-inset-top');
    expect(style).toContain('safe-area-inset-bottom');
    expect(style).toContain('min-height: 44px');
    expect(style).toContain('grid-template-rows: repeat(7, minmax(0, 1fr))');
    expect(style).toContain('.data-panel[data-expanded="true"] dl');
  });
});
