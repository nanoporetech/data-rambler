import type { ObjectExpression } from '../../parser/expression.type';
import type { SimpleObject, SimpleValue } from '../../SimpleValue.type';
import { eval_any_expr, ExpressionEnvironment } from '../expression';
import { extended_typeof } from '../functions';

export function eval_object_expr(ctx: ExpressionEnvironment, expr: ObjectExpression, value: SimpleValue): SimpleObject {
  const result: SimpleObject = {};
  for (const pair of expr.elements) {
    const k  = eval_any_expr(ctx, pair.key, value);
    if (k === undefined) {
      continue;
    }
    if (typeof k !== 'string') {
      throw new TypeError(`Key in object structure must evaluate to a string; got: ${extended_typeof(k)}`);
    }
    const v = eval_any_expr(ctx, pair.value, value);
    if (v === undefined) {
      continue;
    }
    result[k] = v;
  }
  return result;
}