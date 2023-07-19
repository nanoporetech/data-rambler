
import type { SimpleArray, SimpleValue } from '../../SimpleValue.type';
import type { BinaryExpression, CallExpression } from '../../parser/expression.type';
import { type_error } from '../../scanner/error';
import { FUNCTION, UNDEFINED, can_assign_value_to, stringify_type, value_typeof } from '../Type';
import type { FunctionType } from '../Type.type';
import { type ExpressionEnvironment, eval_any_expr } from '../expression';
import { extended_typeof } from '../functions';
import type { TypedFunction } from '../functions.type';

export function eval_chain_expr(ctx: ExpressionEnvironment, expr: BinaryExpression<'chain_expression'>): SimpleValue {
  const left = eval_any_expr(ctx, expr.left);
  const args = [ left ];
  let callee: SimpleValue;

  if (expr.right.type === 'call_expression') {
    args.push(...expr.right.arguments.map(arg => eval_any_expr(ctx, arg)));
    callee = eval_any_expr(ctx, expr.right.callee);
  } else {
    callee = eval_any_expr(ctx, expr.right);
  }

  if (typeof callee !== 'function') {
    type_error(`Expected function but received ${extended_typeof(callee)}`, expr.right.fragment);
  }

  return callee(...args);
}

export function eval_call_expr (ctx: ExpressionEnvironment, expr: CallExpression): SimpleValue {
  const callee = eval_any_expr(ctx, expr.callee);
  if (typeof callee !== 'function') {
    type_error(`Expected function but received ${extended_typeof(callee)}`, expr.callee.fragment);
  }
  const signature = (callee as TypedFunction).SIGNATURE ?? FUNCTION;
  const args = expr.arguments.map((child_expr) => eval_any_expr(ctx, child_expr));

  // TODO handle undefined
  typecheck(signature, args);

  return callee(...args);
}

function typecheck (signature: FunctionType, args: SimpleArray) {
  const min_arity = signature.parameters.filter(type => {
    if ('union' in type) {
      return !type.union.includes(UNDEFINED);
    }
    return true;
  }).length;

  const max_arity = signature.rest ? Infinity : signature.parameters.length;

  if (args.length < min_arity) {
    throw new Error(`Expected ${min_arity} arguments, but got ${args.length}.`);
  }
  if (args.length > max_arity) {
    throw new Error(`Expected ${max_arity} arguments, but got ${args.length}.`);
  }

  // NOTE start by validating all arguments against parameters
  for (let i = 0; i < args.length; i += 1) {
    const param = signature.parameters[i] ?? signature.rest;
    const arg = args[i];

    if (!can_assign_value_to(arg, param!)) {
      if (arg === undefined) {
        // TODO
        return;
      }
      throw new Error(`Argument of type '${stringify_type(value_typeof(arg, true))}' is not assignable to parameter of type '${stringify_type(param)}'.`);
    }
  }
}
