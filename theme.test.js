const {
  normalizeTheme, readTheme, writeTheme, applyTheme, STORAGE_KEY
} = require('./theme.js');

describe('calculator visual themes', () => {
  test('pink is the default and unsupported values fall back to pink', () => {
    expect(normalizeTheme(undefined)).toBe('pink');
    expect(normalizeTheme('pink')).toBe('pink');
    expect(normalizeTheme('classic')).toBe('classic');
    expect(normalizeTheme('other')).toBe('pink');
  });

  test('saved theme is restored and can be changed', () => {
    const items = new Map();
    const storage = {
      getItem: key => items.get(key) || null,
      setItem: (key, value) => items.set(key, value)
    };
    expect(readTheme(storage)).toBe('pink');
    expect(writeTheme(storage, 'classic')).toBe('classic');
    expect(items.get(STORAGE_KEY)).toBe('classic');
    expect(readTheme(storage)).toBe('classic');
    expect(writeTheme(storage, 'pink')).toBe('pink');
  });

  test('private browsing / restricted storage does not crash', () => {
    const storage = {
      getItem: () => { throw new Error('access denied'); },
      setItem: () => { throw new Error('access denied'); }
    };
    expect(readTheme(storage)).toBe('pink');
    expect(writeTheme(storage, 'classic')).toBe('classic');
  });

  test('updates palette, browser chrome, and accessible toggle label', () => {
    const attributes = {};
    const themeColor = { setAttribute: (key, value) => { attributes['meta-' + key] = value; } };
    const toggle = { setAttribute: (key, value) => { attributes[key] = value; } };
    const label = { textContent: '' };
    const icon = { textContent: '' };
    const fakeDocument = {
      documentElement: { setAttribute: (key, value) => { attributes[key] = value; } },
      querySelector: () => themeColor,
      getElementById: id => ({
        'theme-toggle': toggle,
        'theme-toggle-label': label,
        'theme-toggle-icon': icon
      }[id] || null)
    };

    expect(applyTheme(fakeDocument, 'pink')).toBe('pink');
    expect(attributes['data-theme']).toBe('pink');
    expect(attributes['meta-content']).toBe('#f1c9d4');
    expect(label.textContent).toBe('Dark mode');
    expect(attributes['aria-label']).toMatch(/classic dark/);

    expect(applyTheme(fakeDocument, 'classic')).toBe('classic');
    expect(attributes['data-theme']).toBe('classic');
    expect(attributes['meta-content']).toBe('#202020');
    expect(label.textContent).toBe('Pink mode');
    expect(attributes['aria-label']).toMatch(/pink theme/);
  });
});
