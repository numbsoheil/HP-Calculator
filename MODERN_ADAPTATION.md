# 10bII+ Modern Web Adaptation

**Prototype URL after GitHub Pages deploy:** `/HP-Calculator/modern.html`

This work is a separate interface inspired by the supplied screenshot of **10bII+ Modern**. It is **not** the original Anishu iOS application, and it does not reuse that application's proprietary assets or source code.

## Architecture

- `modern.html`: mobile-first HTML/CSS keyboard and register display.
- `modern.css`: independently styled dark UI (no screenshot bitmap).
- `modern.js`: algebraic entry controller; intentionally separate from the original HP 12C Reverse Polish Notation (RPN) class.
- `calculator-core.js`: reused financial and mathematical formulas from the upstream HP12c simulator.
- `modern.test.js`: Jest tests for initial interactive behavior.

The original calculator is still available at `index.html`.

## Initial implementation

- Numeric entry, decimal, backspace, clear, plus/minus, %.
- Algebraic +, −, ×, ÷, and equals.
- TVM storage and solution: N, annual I/YR, PV, PMT, FV; payment frequency defaults to 12.
- Orange-shift PMT changes P/YR (1–365).
- Orange-shift MAR toggles beginning/end payments.
- Memory store/recall/add, selected unary math functions (LN, exp, reciprocal, sqrt, square, pi).
- Mobile-first layout modeled on the screenshot, accessible clickable keys and numeric desktop keyboard input.
- Live register readout and explicit messaging for unimplemented functions.

## Important differences and work remaining

- **This is an early prototype, not an HP 10bII+ validated emulator.**
- The HP 12C source assumes RPN and some model-specific rounding conventions; these must be verified and changed where 10bII+ behavior differs.
- TVM solver currently treats I/YR as an annual **nominal** percentage with `periodic = I/YR / P/YR`; reference cases should verify every mode.
- Many screenshot labels are visual placeholders pending behavioral implementation: amortization, cash-flow series, IRR/NPV, bond PRICE/YTM, date calculations, depreciation, statistics, breakeven, and advanced input modes.
- Blue shift currently marks a function as pending; orange shift supports only a documented subset.
- A responsive layout is implemented, but screenshot-level visual QA on actual iPhone sizes is still needed.
- Live calculation state is not yet persisted across reloads.
- No claim is made that the new UI meets exact original iOS implementation behavior.

## Testing locally

```bash
npm ci
npm test -- --runInBand
npm start
```

Open `http://localhost:8080/modern.html`. The existing original calculator is at `http://localhost:8080/`.

## Adaptation checklist

1. Confirm screenshot key geometry, colors, and alignment on common iPhone widths.
2. Validate 10bII+ TVM examples, including BEG/END, compounding, P/YR and rounding.
3. Extract a common calculation library with stable APIs, instead of relying on model-specific RPN semantics.
4. Implement cash-flow editing, IRR and NPV workflows with repeat counts and test cases.
5. Implement bond, depreciation, date, statistical and breakeven modes.
6. Add complete secondary-key mappings and calculator state persistence.
7. Run automated tests and browser interaction checks before merging to `main`.

## Attribution and licensing

This fork descends from [mscottsewell/HP12c](https://github.com/mscottsewell/HP12c). Preserve upstream commit history and existing attribution. The upstream `package.json` declares ISC; verify the complete license/asset rights before distributing a commercial adaptation.
