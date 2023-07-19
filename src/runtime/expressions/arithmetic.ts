import type { ArithmeticExpression } from '../../parser/expression.type';
import type { SimpleValue } from '../../SimpleValue.type';
import { enforce_string, enforce_number, type ExpressionEnvironment, eval_any_expr } from '../expression';

export function eval_add_expr(expr: ArithmeticExpression, left: SimpleValue, right: SimpleValue): string | number {
  if (typeof left === 'string' || typeof right === 'string') {
    enforce_string(expr.left, left);
    enforce_string(expr.right, right);
    return left + right;
  } else {
    enforce_number(expr.left, left);
    enforce_number(expr.right, right);
    return left + right;
  }
}

export function eval_arithmetic_expr(ctx: ExpressionEnvironment, expr: ArithmeticExpression): string | number | undefined {
  const left = eval_any_expr(ctx, expr.left);
  const right = eval_any_expr(ctx, expr.right);
  
  if (left === undefined || right === undefined) {
    return undefined;
  }

  if (expr.type === 'add_expression') {
    return eval_add_expr(expr, left, right);
  }

  enforce_number(expr.left, left);
  enforce_number(expr.right, right);

  switch (expr.type) {
    case 'subtract_expression':       return left - right;
    case 'multiply_expression':       return left * right;
    case 'divide_expression':         return left / right;
    case 'remainder_expression':      return left % right;
    case 'exponentiation_expression': return left ** right;
  }
}
