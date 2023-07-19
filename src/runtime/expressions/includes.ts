
import { Range } from '../../Range';
import type { BinaryExpression } from '../../parser/expression.type';
import { type_error } from '../../scanner/error';
import { type ExpressionEnvironment, eval_any_expr } from '../expression';

export function eval_in_expr(ctx: ExpressionEnvironment, expr: BinaryExpression<'logical_in_expression'>): boolean {
  const left = eval_any_expr(ctx, expr.left);
  const right = eval_any_expr(ctx, expr.right);

  if (left === undefined || right === undefined) {
    return false;
  }

  if (Array.isArray(right)) {
    return right.includes(left);
  }

  if (right instanceof Range) {
    if (typeof left !== 'number') {
      // TODO
      type_error('', expr.left.fragment);
    }
    right.includes(left);
  }

  if (typeof right !== 'object' || right === null) {
    // TODO
    type_error('', expr.right.fragment);
  }

  if (typeof left !== 'string') {
    // TODO
    type_error('', expr.left.fragment);
  }

  return left in right;
}