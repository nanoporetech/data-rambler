import type { SimpleFunction } from '../../SimpleValue.type';
import type { FunctionExpression } from '../../parser/expression.type';
import { eval_any_expr, type ExpressionEnvironment } from '../expression';

export function eval_function_expr(ctx: ExpressionEnvironment, expr: FunctionExpression): SimpleFunction {
  return (...args) => {
    const scope = {
      ...ctx,
      ...Object.fromEntries(expr.parameters.map((symbol, i) => [symbol, args[i]])),
    };
    return eval_any_expr(scope, expr.body);
  };
}