/* 10bII-inspired algebraic controller.
 * Financial formulas are reused from the fork's original calculator-core.js.
 * This does not replace or modify the HP12c RPN simulator.
 */
(function (root) {
  'use strict';

  const math = typeof module !== 'undefined' && module.exports
    ? require('./calculator-core.js') : root;

  const TVM_KEYS = { n: 'n', iy: 'i', pv: 'pv', pmt: 'pmt', fv: 'fv' };
  const OPERATIONS = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => { if (b === 0) throw new Error('Division by zero'); return a / b; }
  };

  class Modern10bEngine {
    constructor() { this.reset(); }

    reset() {
      this.entry = null;
      this.value = 0;
      this.accumulator = null;
      this.operator = null;
      this.financial = { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 };
      this.periodsPerYear = 12;
      this.beginMode = false;
      this.memory = 0;
      this.lastKey = '';
      this.message = 'Ready · Algebraic entry';
      this.error = false;
      return this;
    }

    get display() {
      if (this.error) return 'Error';
      if (this.entry !== null) return this.entry;
      if (!Number.isFinite(this.value)) return 'Error';
      return this.value.toLocaleString('en-US', { maximumFractionDigits: 8, minimumFractionDigits: 2 });
    }

    get state() {
      return {
        display: this.display,
        lastKey: this.lastKey,
        message: this.message,
        value: this.value,
        x: this.value,
        y: this.accumulator,
        input: this.entry,
        financial: { ...this.financial },
        periodsPerYear: this.periodsPerYear,
        beginMode: this.beginMode,
        memory: this.memory,
        error: this.error
      };
    }

    fail(message) {
      this.error = true;
      this.message = message;
      this.entry = null;
    }

    setValue(value, message) {
      if (!Number.isFinite(value)) throw new Error('Result is not finite');
      this.value = value;
      this.entry = null;
      this.error = false;
      this.message = message;
    }

    takeValue() { return this.entry === null ? this.value : Number(this.entry); }

    digit(digit) {
      if (this.error) { this.error = false; this.entry = null; this.value = 0; }
      if (this.entry === null) this.entry = digit === '.' ? '0.' : digit;
      else if (digit === '.' && this.entry.includes('.')) return;
      else if (digit !== '.' && this.entry.replace(/[-.]/g, '').length >= 12) return;
      else if (digit !== '.' && this.entry === '0') this.entry = digit;
      else if (digit !== '.' && this.entry === '-0') this.entry = '-' + digit;
      else this.entry += digit;
      this.value = Number(this.entry);
      this.message = 'Entering number';
    }

    algebra(key) {
      if (key === 'equals') {
        if (this.operator === null || this.accumulator === null) return;
        const result = OPERATIONS[this.operator](this.accumulator, this.takeValue());
        this.accumulator = null;
        this.operator = null;
        this.setValue(result, 'Result');
        return;
      }
      if (this.operator !== null && this.accumulator !== null && this.entry !== null) {
        this.accumulator = OPERATIONS[this.operator](this.accumulator, this.takeValue());
      } else {
        this.accumulator = this.takeValue();
      }
      this.entry = null;
      this.value = this.accumulator;
      this.operator = key;
      this.message = 'Operator: ' + key;
    }

    tvm(key) {
      const register = TVM_KEYS[key];
      if (this.entry !== null) {
        const v = this.takeValue();
        if (register === 'n' && (!Number.isInteger(v) || v < 0)) throw new Error('N must be a nonnegative whole number');
        this.financial[register] = v;
        this.setValue(v, register.toUpperCase() + ' stored');
        return;
      }
      const { n, i, pv, pmt, fv } = this.financial;
      const periodicRate = i / this.periodsPerYear;
      if (key !== 'n' && n <= 0) throw new Error('Enter N first');
      let result;
      switch (key) {
        case 'fv': result = math.calculateFV(n, periodicRate, pv, pmt, this.beginMode); break;
        case 'pv': result = math.calculatePV(n, periodicRate, pmt, fv, this.beginMode); break;
        case 'pmt': result = math.calculatePMT(n, periodicRate, pv, fv, this.beginMode); break;
        case 'n': result = math.calculateN(periodicRate, pv, pmt, fv, this.beginMode); break;
        case 'iy': result = math.calculateI(n, pv, pmt, fv, this.beginMode) * this.periodsPerYear; break;
        default: return;
      }
      if (!Number.isFinite(result)) throw new Error('Unable to solve financial register');
      this.financial[register] = result;
      this.setValue(result, register.toUpperCase() + ' calculated');
    }

    shifted(key, layer) {
      if (layer === 'blue') {
        this.message = 'Blue function pending: ' + key;
        return;
      }
      // Orange functions printed below the keys in the reference layout.
      switch (key) {
        case 'pmt': {
          if (this.entry !== null) {
            const n = this.takeValue();
            if (!Number.isInteger(n) || n < 1 || n > 365) throw new Error('P/YR must be an integer from 1 to 365');
            this.periodsPerYear = n;
          }
          this.setValue(this.periodsPerYear, 'Payments per year (P/YR)');
          return;
        }
        case 'mar':
          this.beginMode = !this.beginMode;
          this.message = this.beginMode ? 'Payments at beginning (BEG)' : 'Payments at end (END)';
          return;
        case 'rcl':
        case 'tomem':
          this.memory = this.takeValue();
          this.message = 'Value stored in memory';
          return;
        case 'c':
          this.reset();
          this.message = 'All registers cleared';
          return;
        case 'divide': this.unary(v => { if (v === 0) throw new Error('Division by zero'); return 1 / v; }, 'Reciprocal'); return;
        case 'minus': this.unary(v => { if (v < 0) throw new Error('Square root of negative number'); return Math.sqrt(v); }, 'Square root'); return;
        case 'plus': this.unary(v => v * v, 'Square'); return;
        case '1': this.unary(v => Math.exp(v), 'e^x'); return;
        case '2': this.unary(v => { if (v <= 0) throw new Error('LN domain error'); return Math.log(v); }, 'Natural log'); return;
        case '0': this.setValue(Math.PI, 'Pi'); return;
        case 'percent':
          if (this.accumulator === null || this.accumulator === 0) throw new Error('Enter base value and then new value');
          this.setValue((this.takeValue() - this.accumulator) / this.accumulator * 100, 'Percent change');
          return;
        default:
          this.message = 'Orange function pending: ' + key;
      }
    }

    unary(fn, label) { this.setValue(fn(this.takeValue()), label); }

    press(key, layer = 'primary') {
      this.lastKey = (layer === 'primary' ? '' : layer + ' + ') + key;
      try {
        if (layer !== 'primary') { this.shifted(key, layer); return this.state; }
        if (/^[0-9]$/.test(key) || key === 'decimal') {
          this.digit(key === 'decimal' ? '.' : key);
        } else if (Object.hasOwn(TVM_KEYS, key)) {
          this.tvm(key);
        } else if (Object.hasOwn(OPERATIONS, key) || key === 'equals') {
          this.algebra(key);
        } else {
          switch (key) {
            case 'clear':
            case 'c':
              this.entry = null;
              this.value = 0;
              this.error = false;
              this.message = 'Entry cleared';
              break;
            case 'back':
              this.entry = this.entry === null ? '0' : this.entry.slice(0, -1);
              if (this.entry === '' || this.entry === '-') this.entry = '0';
              this.value = Number(this.entry);
              this.error = false;
              this.message = 'Backspace';
              break;
            case 'sign': this.setValue(-this.takeValue(), 'Sign changed'); this.entry = String(this.value); break;
            case 'percent': this.unary(v => v / 100, 'Percent / 100'); break;
            case 'rcl':
            case 'rm': this.setValue(this.memory, 'Memory recalled'); break;
            case 'mplus': this.memory += this.takeValue(); this.message = 'Added to memory'; break;
            case 'tomem': this.memory = this.takeValue(); this.message = 'Stored in memory'; break;
            case 'menu': this.message = 'Menu settings coming in a later milestone'; break;
            default: this.message = 'Function pending: ' + key;
          }
        }
      } catch (err) {
        this.fail(err.message || 'Calculation error');
      }
      return this.state;
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { Modern10bEngine };
  root.Modern10bEngine = Modern10bEngine;

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const calculator = new Modern10bEngine();
      const screen = document.getElementById('modern-display');
      if (!screen) return;
      const keyboard = document.getElementById('modern-keyboard');
      const status = document.getElementById('modern-status');
      const panels = ['modern-buffer', 'modern-x', 'modern-input', 'modern-y', 'modern-pyr'];
      let layer = 'primary';

      function render() {
        const s = calculator.state;
        screen.textContent = s.display;
        screen.setAttribute('aria-label', 'Display: ' + s.display);
        status.textContent = s.message + (s.beginMode ? ' · BEG' : ' · END');
        document.getElementById('modern-buffer').textContent = s.lastKey || '—';
        document.getElementById('modern-x').textContent = String(s.x);
        document.getElementById('modern-input').textContent = s.input === null ? '—' : s.input;
        document.getElementById('modern-y').textContent = s.y === null ? '—' : String(s.y);
        document.getElementById('modern-pyr').textContent = String(s.periodsPerYear);
        screen.classList.toggle('error', s.error);
        for (const button of keyboard.querySelectorAll('[data-layer]')) {
          button.classList.toggle('active-shift', button.dataset.layer === layer);
          button.setAttribute('aria-pressed', String(button.dataset.layer === layer));
        }
      }

      function activate(button) {
        if (button.dataset.layer) {
          layer = layer === button.dataset.layer ? 'primary' : button.dataset.layer;
          render();
          return;
        }
        calculator.press(button.dataset.key, layer);
        layer = 'primary';
        render();
      }

      keyboard.addEventListener('click', event => {
        const button = event.target.closest('button[data-key],button[data-layer]');
        if (button && keyboard.contains(button)) activate(button);
      });

      document.addEventListener('keydown', event => {
        if (event.target.closest('input,textarea,[contenteditable]') || event.metaKey || event.ctrlKey || event.altKey) return;
        const mapping = { '.':'decimal', ',':'decimal', '+':'add', '-':'subtract', '*':'multiply', '/':'divide', '=':'equals', 'Enter':'equals', 'Backspace':'back', 'Escape':'c' };
        const key = /^[0-9]$/.test(event.key) ? event.key : mapping[event.key];
        if (!key) return;
        event.preventDefault();
        calculator.press(key);
        layer = 'primary';
        render();
      });

      render();
      // Make the controller available for manual QA without leaking browser state to tests.
      root.modern10bCalculator = calculator;
    });
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
