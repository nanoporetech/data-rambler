import type { ComparisonExpression } from '../../parser/expression.type';
import { enforce_number, eval_any_expr, type ExpressionEnvironment } from '../expression';

export function eval_comparison_expr(ctx: ExpressionEnvironment, expr: ComparisonExpression): boolean | undefined {
  const left = eval_any_expr(ctx, expr.left);
  const right = eval_any_expr(ctx, expr.right);

  if (left !== undefined) {
    enforce_number(expr.left, left);
  }
  if (right !== undefined) {
    enforce_number(expr.right, right);
  }

  if (left === undefined || right === undefined) {
    return undefined;
  }

  // TODO this is currently limited to numbers, but we could also support strings

  switch (expr.type) {
    case 'less_than_expression':              return left < right;
    case 'less_than_or_equals_expression':    return left <= right;
    case 'greater_than_expression':           return left > right;
    case 'greater_than_or_equals_expression': return left >= right;
  }
}