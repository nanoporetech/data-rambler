import type { ObjectExpression } from '../../parser/expression.type';
import { type_error } from '../../scanner/error';
import type { SimpleObject } from '../../SimpleValue.type';
import { eval_any_expr, type ExpressionEnvironment } from '../expression';
import { extended_typeof } from '../functions';

export function eval_object_expr(ctx: ExpressionEnvironment, expr: ObjectExpression): SimpleObject {
  const result: SimpleObject = {};
  for (const pair of expr.elements) {
    const k  = eval_any_expr(ctx, pair.key);
    if (k === undefined) {
      continue;
    }
    if (typeof k !== 'string') {
      type_error(`Key in object structure must evaluate to a string; got: ${extended_typeof(k)}`, pair.key.fragment);
    }
    const v = eval_any_expr(ctx, pair.value);
    if (v === undefined) {
      continue;
    }
    result[k] = v;
  }
  return result;
}