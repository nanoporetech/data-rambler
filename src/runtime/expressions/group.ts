import type { SimpleValue } from '../../SimpleValue.type';
import type { GroupExpression } from '../../parser/expression.type';
import { type ExpressionEnvironment, eval_any_expr } from '../expression';

export function eval_group_expr(ctx: ExpressionEnvironment, expr: GroupExpression): SimpleValue {
  if (!expr.expression) {
    return undefined;
  }
  return eval_any_expr(ctx, expr.expression);
}