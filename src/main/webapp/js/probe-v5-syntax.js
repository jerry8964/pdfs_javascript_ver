/*
 * ES2022+ probe:
 * - public class field
 * - private class field
 * - static initialization block
 * - optional chaining / nullish coalescing
 * - logical assignment operators
 */
class PdfjsV5SyntaxProbe {
  value = 1;
  #secret = 2;
  static state = 0;
  static {
    this.state ||= 1;
  }
  run() {
    let payload = null;
    payload ??= { count: 0 };
    payload.count ||= 1;
    payload.count &&= payload.count;
    return (payload?.count ?? 0) + this.value + this.#secret;
  }
}

window.__PDFJS_V5_SYNTAX_OK__ = new PdfjsV5SyntaxProbe().run() > 0;
