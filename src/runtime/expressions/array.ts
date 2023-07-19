import type { ArrayExpression } from '../../parser/expression.type';
import { Range } from '../../Range';
import type { SimpleArray, SimpleValue } from '../../SimpleValue.type';
import { eval_any_expr, type ExpressionEnvironment } from '../expression';

export function eval_array_expr(ctx: ExpressionEnvironment, expr: ArrayExpression): SimpleArray {
  let result: SimpleValue[] = [];
  for (const subexpr of expr.elements) {
    const el = eval_any_expr(ctx, subexpr);
    if (el instanceof Range) {
      result = result.concat(el.expand());
    } else if (Array.isArray(el)) {
      result = result.concat(el);
    } else {
      result.push(el);
    }
  }
  return result;
}