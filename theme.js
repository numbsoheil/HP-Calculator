/* Visual theme preference only; calculator calculations are independent. */
(function (root) {
  'use strict';
  const STORAGE_KEY = 'hp-calculator-visual-theme';
  const COLORS = Object.freeze({ pink: '#f1c9d4', classic: '#202020' });

  function normalizeTheme(value) {
    return value === 'classic' ? 'classic' : 'pink';
  }

  function readTheme(storage) {
    try {
      return normalizeTheme(storage && storage.getItem(STORAGE_KEY));
    } catch (_) {
      return 'pink';
    }
  }

  function writeTheme(storage, value) {
    const theme = normalizeTheme(value);
    try {
      if (storage) storage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      // Browsers with restricted localStorage should still allow theme switching.
    }
    return theme;
  }

  function applyTheme(doc, value) {
    const theme = normalizeTheme(value);
    doc.documentElement.setAttribute('data-theme', theme);
    const meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORS[theme]);

    const toggle = doc.getElementById('theme-toggle');
    if (toggle) {
      const label = doc.getElementById('theme-toggle-label');
      const icon = doc.getElementById('theme-toggle-icon');
      if (label) label.textContent = theme === 'pink' ? 'Dark mode' : 'Pink mode';
      if (icon) icon.textContent = theme === 'pink' ? '☾' : '♡';
      toggle.setAttribute('aria-label', theme === 'pink' ? 'Switch to classic dark theme' : 'Switch to Casio-inspired pink theme');
    }
    return theme;
  }

  function init(doc, storage) {
    applyTheme(doc, readTheme(storage));
    const toggle = doc.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const next = doc.documentElement.getAttribute('data-theme') === 'pink' ? 'classic' : 'pink';
      applyTheme(doc, writeTheme(storage, next));
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STORAGE_KEY, normalizeTheme, readTheme, writeTheme, applyTheme };
  }

  if (typeof document !== 'undefined') {
    let storage = null;
    try { storage = root.localStorage; } catch (_) {}
    applyTheme(document, readTheme(storage));
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(document, storage), { once: true });
    } else {
      init(document, storage);
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
