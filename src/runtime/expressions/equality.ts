import type { EqualityExpression } from '../../parser/expression.type';
import { type ExpressionEnvironment, eval_any_expr } from '../expression';
import { equals } from '../functions';

export function eval_equality_expr(ctx: ExpressionEnvironment, expr: EqualityExpression): boolean {
  const left = eval_any_expr(ctx, expr.left);
  const right = eval_any_expr(ctx, expr.right);

  if (left === undefined || right === undefined) {
    return false;
  }

  const strict = equals(left, right);
  return expr.type === 'equals_expression' === strict;
}