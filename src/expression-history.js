export class ExpressionHistory {
  constructor(limit = 12) { this.limit = limit; this.items = []; this.lastExpression = null; }
  add(expression, score) {
    if (expression === this.lastExpression) return false;
    this.lastExpression = expression;
    this.items.unshift({ expression, score, time: new Date() }); this.items = this.items.slice(0, this.limit); return true;
  }
  clear() { this.items = []; this.lastExpression = null; }
}
