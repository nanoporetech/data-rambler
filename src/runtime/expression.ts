import { Range } from '../Range';

export type ExpressionEnvironment = Record<string, SimpleValue>;

import type { SimpleValue } from '../SimpleValue.type';
import type { Expression } from '../parser/expression.type';
import type { Runtime } from './Runtime';
import { eval_object_expr } from './expressions/object';
import { eval_array_expr } from './expressions/array';
import { eval_range_expr } from './expressions/range';
import { extended_typeof } from './functions';
import { type_error } from '../scanner/error';
import { eval_function_expr } from './expressions/function';
import { eval_comparison_expr } from './expressions/comparison';
import { eval_equality_expr } from './expressions/equality';
import { eval_conditional_expr } from './expressions/conditional';
import { eval_computed_property_expr, eval_property_expr, eval_wild_expr } from './expressions/property';
import { eval_call_expr, eval_chain_expr } from './expressions/call';
import { eval_in_expr } from './expressions/includes';
import { eval_simple_prefix_expr } from './expressions/simple_prefix';
import { eval_arithmetic_expr } from './expressions/arithmetic';
import { eval_group_expr } from './expressions/group';

export function eval_root_expr(runtime: Runtime, expr: Expression, bindings: Record<string, SimpleValue>): SimpleValue {
  const result = eval_any_expr({ ...runtime.globals, ...bindings }, expr);
  return result instanceof Range ? result.expand() : result;
}

export function eval_any_expr(ctx: ExpressionEnvironment, expr: Expression): SimpleValue {
  switch (expr.type) {

    case 'plus_expression':
    case 'not_expression':
    case 'typeof_expression':
    case 'negate_expression':                 return eval_simple_prefix_expr(ctx, expr);

    case 'add_expression':
    case 'subtract_expression':
    case 'multiply_expression':
    case 'divide_expression':
    case 'remainder_expression':
    case 'exponentiation_expression':         return eval_arithmetic_expr(ctx, expr);

    case 'less_than_expression':
    case 'less_than_or_equals_expression':
    case 'greater_than_expression':
    case 'greater_than_or_equals_expression': return eval_comparison_expr(ctx, expr);

    case 'equals_expression':
    case 'not_equals_expression':             return eval_equality_expr(ctx, expr);
    case 'chain_expression':                  return eval_chain_expr(ctx, expr);
    case 'logical_in_expression':             return eval_in_expr(ctx, expr);
    case 'conditional_expression':            return eval_conditional_expr(ctx, expr);
    case 'array_expression':                  return eval_array_expr(ctx, expr);
    case 'object_expression':                 return eval_object_expr(ctx, expr);
    case 'function_expression':               return eval_function_expr(ctx, expr);
    case 'call_expression':                   return eval_call_expr(ctx, expr);
    case 'range_expression':                  return eval_range_expr(ctx, expr);
    case 'group_expression':                  return eval_group_expr(ctx, expr);

    case 'json_expression':                   return expr.value;
    case 'identifier_expression':             return ctx[expr.value];
    case 'assignment_expression':             return ctx[expr.symbol] = eval_any_expr(ctx, expr.expression);

    case 'comma_expression':                  return eval_any_expr(ctx, expr.left), eval_any_expr(ctx, expr.right);
    case 'coalescing_expression':             return eval_any_expr(ctx, expr.left) ?? eval_any_expr(ctx, expr.right);
    case 'logical_and_expression':            return !!(eval_any_expr(ctx, expr.left) && eval_any_expr(ctx, expr.right));
    case 'logical_or_expression':             return !!(eval_any_expr(ctx, expr.left) || eval_any_expr(ctx, expr.right));

    case 'property_expression':               return eval_property_expr(ctx, expr);
    case 'computed_property_expression':      return eval_computed_property_expr(ctx, expr);
    case 'wild_expression':                   return eval_wild_expr(ctx, expr);
  }
}

export function enforce_number(node: Expression, value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    type_error(`Expected number but received ${extended_typeof(value)}`, node.fragment);
  }
  if (isNaN(value)) {
    type_error('Expected number but received NaN', node.fragment);
  }
}

export function enforce_string(node: Expression, value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    type_error(`Expected string but received ${extended_typeof(value)}`, node.fragment);
  }
}