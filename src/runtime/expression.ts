import { Range } from '../Range';

export type ExpressionEnvironment = Record<string, SimpleValue>;

import type { SimpleFunction, SimpleValue } from '../SimpleValue.type';
import type { Expression, BinaryExpression, ComparisonExpression, ArithmeticExpression, ConditionalExpression, EqualityExpression, FunctionExpression, CallExpression, SimplePrefixExpression, GroupExpression } from '../parser/expression.type';
import type { Runtime } from './Runtime';
import { eval_field_expr, eval_parent_expr, eval_path_expr, eval_wild_expr } from './expressions/path';
import { eval_object_expr } from './expressions/object';
import { eval_array_expr } from './expressions/array';
import { eval_range_expr } from './expressions/range';
import { cast_bool, cast_string, equals, extended_typeof } from './functions';
import { can_assign_value_to, FUNCTION, stringify_type, UNDEFINED, value_typeof } from './Type';
import type { TypedFunction } from './functions.type';

export function eval_root_expr(runtime: Runtime, expr: Expression, value: SimpleValue, bindings: Record<string, SimpleValue>): SimpleValue {
  const result = eval_any_expr({ ...runtime.globals, ...bindings, $: value }, expr, value);
  return result instanceof Range ? result.expand() : result;
}

export function eval_any_expr(ctx: ExpressionEnvironment, expr: Expression, value: SimpleValue): SimpleValue {
  switch (expr.type) {

    case 'not_expression':
    case 'typeof_expression':
    case 'negate_expression':                 return eval_simple_prefix_expr(ctx, expr, value);

    case 'add_expression':
    case 'subtract_expression':
    case 'multiply_expression':
    case 'divide_expression':
    case 'remainder_expression':
    case 'exponentiation_expression':         return eval_arithmetic_expr(ctx, expr, value);

    case 'less_than_expression':
    case 'less_than_or_equals_expression':
    case 'greater_than_expression':
    case 'greater_than_or_equals_expression': return eval_comparison_expr(ctx, expr, value);

    case 'equals_expression':
    case 'not_equals_expression':             return eval_equality_expr(ctx, expr, value);
    case 'chain_expression':                  return eval_chain_expr(ctx, expr, value);
    case 'path_expression':                   return eval_path_expr(ctx, expr, value);
    case 'field_expression':                  return eval_field_expr(expr, value);
    case 'wildcard_expression':               return eval_wild_expr(false, value);
    case 'descendant_expression':             return eval_wild_expr(true, value);
    case 'parent_expression':                 return eval_parent_expr();
    case 'concat_expression':                 return eval_concat_expr(ctx, expr, value);
    case 'logical_in_expression':             return eval_in_expr(ctx, expr, value);
    case 'conditional_expression':            return eval_conditional_expr(ctx, expr, value);
    case 'array_expression':                  return eval_array_expr(ctx, expr, value);
    case 'object_expression':                 return eval_object_expr(ctx, expr, value);
    case 'function_expression':               return eval_function_expr(ctx, expr, value);
    case 'call_expression':                   return eval_call_expr(ctx, expr, value);
    case 'range_expression':                  return eval_range_expr(ctx, expr, value);
    case 'group_expression':                  return eval_group_expr(ctx, expr, value);

    case 'json_expression':                   return expr.value;
    case 'identifier_expression':             return expr.value === '' ? value :ctx[expr.value];
    case 'assignment_expression':             return ctx[expr.symbol] = eval_any_expr(ctx, expr.expression, value);

    case 'comma_expression':                  return eval_any_expr(ctx, expr.left, value), eval_any_expr(ctx, expr.right, value);
    case 'coalescing_expression':             return eval_any_expr(ctx, expr.left, value) ?? eval_any_expr(ctx, expr.right, value);
    case 'logical_and_expression':            return !!(eval_any_expr(ctx, expr.left, value) && eval_any_expr(ctx, expr.right, value));
    case 'logical_or_expression':             return !!(eval_any_expr(ctx, expr.left, value) || eval_any_expr(ctx, expr.right, value));
  }
}

export function eval_comparison_expr(ctx: ExpressionEnvironment, expr: ComparisonExpression, value: SimpleValue): boolean | undefined {
  const left = eval_any_expr(ctx, expr.left, value);
  const right = eval_any_expr(ctx, expr.right, value);

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

export function eval_arithmetic_expr(ctx: ExpressionEnvironment, expr: ArithmeticExpression, value: SimpleValue): number | undefined {
  const left = eval_any_expr(ctx, expr.left, value);
  const right = eval_any_expr(ctx, expr.right, value);

  if (left !== undefined) {
    enforce_number(expr.left, left);
  }
  if (right !== undefined) {
    enforce_number(expr.right, right);
  }

  if (left === undefined || right === undefined) {
    return undefined;
  }

  switch (expr.type) {
    case 'add_expression':            return left + right;
    case 'subtract_expression':       return left - right;
    case 'multiply_expression':       return left * right;
    case 'divide_expression':         return left / right;
    case 'remainder_expression':      return left % right;
    case 'exponentiation_expression': return left ** right;
  }
}

export function eval_simple_prefix_expr (ctx: ExpressionEnvironment, expr: SimplePrefixExpression, value: SimpleValue): SimpleValue | undefined {
  const intermediate = eval_any_expr(ctx, expr.expression, value);

  if (intermediate === undefined) {
    return undefined;
  }

  switch(expr.type) {
    case 'negate_expression': enforce_number(expr.expression, intermediate); return -intermediate;
    case 'not_expression':    return !cast_bool(intermediate);
    case 'typeof_expression': return extended_typeof(intermediate);
  }
}

export function eval_equality_expr(ctx: ExpressionEnvironment, expr: EqualityExpression, value: SimpleValue): boolean {
  const left = eval_any_expr(ctx, expr.left, value);
  const right = eval_any_expr(ctx, expr.right, value);

  if (left === undefined || right === undefined) {
    return false;
  }

  const strict = equals(left, right);
  return expr.type === 'equals_expression' === strict;
}

export function eval_chain_expr(ctx: ExpressionEnvironment, expr: BinaryExpression<'chain_expression'>, value: SimpleValue): SimpleValue {
  const left = eval_any_expr(ctx, expr.left, value);
  const args = [ left ];
  let callee: SimpleValue;

  // partial application is only supported when RHS is a call expression
  if (expr.right.type === 'call_expression') {
    args.push(...expr.right.arguments.map(arg => eval_any_expr(ctx, arg, value)));
    callee = eval_any_expr(ctx, expr.right.callee, value);
  } else {
    callee = eval_any_expr(ctx, expr.right, value);
  }

  if (typeof callee !== 'function') {
    throw new Error('Attempted to invoke a non-function'); // TODO improve message
  }

  return callee(...args);
}

export function eval_conditional_expr(ctx: ExpressionEnvironment, expr: ConditionalExpression, value: SimpleValue): SimpleValue {
  if (eval_any_expr(ctx, expr.condition, value)) {
    return eval_any_expr(ctx, expr.then_expression, value);
  }
  else if (expr.else_expression) {
    return eval_any_expr(ctx, expr.else_expression, value);
  }
  return undefined;
}

export function eval_in_expr(ctx: ExpressionEnvironment, expr: BinaryExpression<'logical_in_expression'>, value: SimpleValue): boolean {
  const left = eval_any_expr(ctx, expr.left, value);
  const right = eval_any_expr(ctx, expr.right, value);

  if (left === undefined || right === undefined) {
    return false;
  }

  return (Array.isArray(right) ? right : [right]).includes(left);
}

export function eval_group_expr(ctx: ExpressionEnvironment, expr: GroupExpression, value: SimpleValue): SimpleValue {
  if (!expr.expression) {
    return undefined;
  }
  return eval_any_expr({ ...ctx }, expr.expression, value);
}

export function eval_function_expr(ctx: ExpressionEnvironment, expr: FunctionExpression, value: SimpleValue): SimpleFunction {
  return (...args) => {
    const scope = {
      ...ctx,
      ...Object.fromEntries(expr.parameters.map((symbol, i) => [symbol, args[i]])),
    };
    return eval_any_expr(scope, expr.body, value);
  };
}

export function eval_call_expr (ctx: ExpressionEnvironment, expr: CallExpression, value: SimpleValue): SimpleValue {
  const fn = eval_any_expr(ctx, expr.callee, value);
  if (typeof fn !== 'function') {
    throw new Error('Attempted to invoke a non-function'); // TODO improve message
  }
  const signature = (fn as TypedFunction).SIGNATURE ?? FUNCTION;
  const args = [];
  let i = 0;

  const min_arity = signature.parameters.filter(type => {
    if ('union' in type) {
      return !type.union.includes(UNDEFINED);
    }
    return true;
  }).length;

  const max_arity = signature.rest ? Infinity : signature.parameters.length;

  if (expr.arguments.length < min_arity) {
    throw new Error(`Expected ${min_arity} arguments, but got ${expr.arguments.length}.`);
  }
  if (expr.arguments.length > max_arity) {
    throw new Error(`Expected ${max_arity} arguments, but got ${expr.arguments.length}.`);
  }

  // NOTE start by validating all arguments against parameters
  for (const child_expr of expr.arguments) {
    const param = signature.parameters[i ++] ?? signature.rest;
    let arg = eval_any_expr(ctx, child_expr, value);

    if (!param) {
      // unreachable
      throw new Error('Missing parameter!');
    }

    // WARN unions that contain 'a' will not respect this magic conversion
    if ('array' in param) {
      if (arg === undefined) {
        arg = [];
      } else if (!Array.isArray(arg)) {
        arg = [ arg ];
      }
    }

    if (!can_assign_value_to(arg, param)) {
      if (arg === undefined) {
        return undefined;
      }
      throw new Error(`Argument of type '${stringify_type(value_typeof(arg, true))}' is not assignable to parameter of type '${stringify_type(param)}'.`);
    }

    args.push(arg);
  }

  return fn(...args);
}

export function eval_concat_expr (ctx: ExpressionEnvironment, expr: BinaryExpression<'concat_expression'>, value: SimpleValue): SimpleValue {
  const left = eval_any_expr(ctx, expr.left, value);
  const right = eval_any_expr(ctx, expr.right, value);
  return `${cast_string(left) ?? ''}${cast_string(right) ?? ''}`;
}

export function enforce_number(node: Expression, value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(`Expected ${node.type} @ (${node.start.row}, ${node.start.column}) to resolve to a number but received ${extended_typeof(value)}`);
  }
  if (isNaN(value)) {
    throw new Error(`Expected ${node.type} @ (${node.start.row}, ${node.start.column}) to resolve to a number but received NaN`);
  }
}

export function enforce_string(node: Expression, value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${node.type} @ (${node.start.row}, ${node.start.column}) to resolve to a string but received ${extended_typeof(value)}`);
  }
}