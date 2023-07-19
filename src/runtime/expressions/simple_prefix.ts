import type { SimpleValue } from '../../SimpleValue.type';
import type { SimplePrefixExpression } from '../../parser/expression.type';
import { type ExpressionEnvironment, eval_any_expr, enforce_number } from '../expression';
import { cast_bool, extended_typeof } from '../functions';

export function eval_simple_prefix_expr (ctx: ExpressionEnvironment, expr: SimplePrefixExpression): SimpleValue | undefined {
  const intermediate = eval_any_expr(ctx, expr.expression);

  if (intermediate === undefined) {
    return undefined;
  }

  switch(expr.type) {
    case 'plus_expression': enforce_number(expr.expression, intermediate); return +intermediate;
    case 'negate_expression': enforce_number(expr.expression, intermediate); return -intermediate;
    case 'not_expression':    return !cast_bool(intermediate);
    case 'typeof_expression': return extended_typeof(intermediate);
  }
}