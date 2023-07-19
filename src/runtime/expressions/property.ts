import { Range } from '../../Range';
import type { SimpleValue, SimpleObject } from '../../SimpleValue.type';
import type { PropertyExpression, ComputedPropertyExpression, WildExpression } from '../../parser/expression.type';
import { type_error } from '../../scanner/error';
import { type ExpressionEnvironment, eval_any_expr, enforce_string } from '../expression';
import { extended_typeof } from '../functions';

export function eval_property_expr(ctx: ExpressionEnvironment, expr: PropertyExpression): SimpleValue {
  const source = eval_any_expr(ctx, expr.left);

  if (Array.isArray(source)) {
    return Array.from(resolve_property_query(source, expr.symbol));
  }

  if (source === null || source instanceof Range || typeof source !== 'object') {
    type_error(`Expected Object but received ${extended_typeof(source)}`, expr.left.fragment);
  }

  return source[expr.symbol];
}

export function eval_computed_property_expr(ctx: ExpressionEnvironment, expr: ComputedPropertyExpression): SimpleValue {
  const source = eval_any_expr(ctx, expr.left);
  const symbol = eval_any_expr(ctx, expr.field);

  if (!Array.isArray(source)) {

    if (source === null || source instanceof Range || typeof source !== 'object') {
      type_error(`Expected Object but received ${extended_typeof(source)}`, expr.left.fragment);
    }
  
    enforce_string(expr.field, symbol);

    return source[symbol];
  }

  if (symbol instanceof Range) {
    return source.slice(symbol.min, symbol.max);
  }

  if (typeof symbol === 'number') {
    return source[symbol];
  }

  enforce_string(expr.field, symbol);
  return Array.from(resolve_property_query(source, symbol));
}

export function eval_wild_expr(ctx: ExpressionEnvironment, expr: WildExpression): SimpleValue {
  const source = eval_any_expr(ctx, expr.left);
  return Array.from(resolve_wild_query(source));
}

export function* create_object_sequence (source: SimpleValue): Iterable<SimpleObject> {
  const stack = [source];

  while (stack.length) {
    // pop value from stack
    const next = stack.shift()!;
    if (Array.isArray(next)) {
      // push back array items
      stack.unshift(...next);
      continue;
    }

    if (typeof next !== 'object' || next instanceof Range || next === null) {
      continue;
    }

    yield next;
  }
}

export function* resolve_property_query(source: SimpleValue, symbol: string): Iterable<SimpleValue> {
  const sequence = create_object_sequence(source);

  for (const el of sequence) {
    const field = el[symbol];
    if (Array.isArray(field)) {
      yield* field;
    }
    // TODO should we expand Range expressions here?
    else if (field !== undefined) {
      yield field;
    }
  }
}

export function* resolve_wild_query(source: SimpleValue): Iterable<SimpleValue> {
  const sequence = create_object_sequence(source);

  for (const el of sequence) {
    for (const field of Object.values(el)) {
      if (Array.isArray(field)) {
        yield* field;
      }
      // TODO should we expand Range expressions here?
      else if (field !== undefined) {
        yield field;
      }
    }    
  }
}