import type { BinaryExpression } from '../../parser/expression.type';
import { Range } from '../../Range';
import { type_error } from '../../scanner/error';
import { enforce_number, eval_any_expr, ExpressionEnvironment } from '../expression';
import { extended_typeof } from '../functions';

export function eval_range_expr(ctx: ExpressionEnvironment, expr: BinaryExpression<'range_expression'>): Range {
  const left = eval_any_expr(ctx, expr.left);
  const right = eval_any_expr(ctx, expr.right);
  
  if (left !== undefined) {
    enforce_number(expr.left, left);
  }
  if (right !== undefined) {
    enforce_number(expr.right, right);
  }
  
  if (left === undefined || right === undefined) {
    return new Range(0, 0);
  }
  
  if (!Number.isInteger(left)) {
    type_error(`Expected integer but received ${extended_typeof(left)}`, expr.left.fragment);
  }
  
  if (!Number.isInteger(right)) {
    type_error(`Expected integer but received ${extended_typeof(right)}`, expr.right.fragment);
  }
  
  return new Range(left, right);
}