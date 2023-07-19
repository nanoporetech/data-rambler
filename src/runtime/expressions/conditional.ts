import type { SimpleValue } from '../../SimpleValue.type';
import type { ConditionalExpression } from '../../parser/expression.type';
import { type ExpressionEnvironment, eval_any_expr } from '../expression';

export function eval_conditional_expr(ctx: ExpressionEnvironment, expr: ConditionalExpression): SimpleValue {
  if (eval_any_expr(ctx, expr.condition)) {
    return eval_any_expr(ctx, expr.then_expression);
  }
  else if (expr.else_expression) {
    return eval_any_expr(ctx, expr.else_expression);
  }
  return undefined;
}