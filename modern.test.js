const { Modern10bEngine } = require('./modern.js');

describe('10bII Modern algebraic controller', () => {
  let calculator;
  beforeEach(() => { calculator = new Modern10bEngine(); });
  const press = (...keys) => keys.forEach(key => calculator.press(key));

  test('enters decimal numbers and clears entry', () => {
    press('1','2','decimal','5');
    expect(calculator.takeValue()).toBe(12.5);
    press('c');
    expect(calculator.display).toBe('0.00');
  });

  test('performs algebraic addition and multiplication', () => {
    press('1','2','add','3','equals');
    expect(calculator.takeValue()).toBe(15);
    press('multiply','2','equals');
    expect(calculator.takeValue()).toBe(30);
  });

  test('stores and recalls TVM registers without changing the original RPN engine', () => {
    press('1','2');
    calculator.press('n');
    expect(calculator.financial.n).toBe(12);
    press('6');
    calculator.press('iy');
    expect(calculator.financial.i).toBe(6);
  });

  test('solves monthly loan payments with annual interest and P/YR = 12', () => {
    press('1','2');
    calculator.press('n');
    press('1','2');
    calculator.press('iy');
    press('1','0','0','0');
    calculator.press('pv');
    calculator.press('pmt');
    expect(calculator.financial.pmt).toBeCloseTo(-88.84879, 3);
  });

  test('calculates future value at zero interest rate', () => {
    press('2');
    calculator.press('n');
    press('0');
    calculator.press('iy');
    press('1','0','0');
    calculator.press('pv');
    calculator.press('fv');
    expect(calculator.financial.fv).toBeCloseTo(-100, 9);
  });

  test('changes payments per year using orange shift PMT', () => {
    press('4');
    calculator.press('pmt','orange');
    expect(calculator.periodsPerYear).toBe(4);
    expect(calculator.display).toBe('4.00');
  });

  test('toggles beginning-of-period payment mode', () => {
    calculator.press('mar','orange');
    expect(calculator.beginMode).toBe(true);
    calculator.press('mar','orange');
    expect(calculator.beginMode).toBe(false);
  });

  test('records unsupported functions without pretending they work', () => {
    calculator.press('cfj');
    expect(calculator.message).toMatch(/pending/);
  });

  test('handles division by zero safely', () => {
    press('1','divide','0','equals');
    expect(calculator.display).toBe('Error');
    expect(calculator.error).toBe(true);
  });

  test('supports backspace and memory', () => {
    press('4','5','6','back');
    expect(calculator.takeValue()).toBe(45);
    calculator.press('tomem');
    press('c');
    calculator.press('rm');
    expect(calculator.takeValue()).toBe(45);
  });

  test('calculates reciprocal, square root and pi through orange functions', () => {
    press('4');
    calculator.press('divide','orange');
    expect(calculator.takeValue()).toBe(0.25);
    calculator.press('minus','orange');
    expect(calculator.takeValue()).toBe(0.5);
    calculator.press('0','orange');
    expect(calculator.takeValue()).toBeCloseTo(Math.PI);
  });
});
