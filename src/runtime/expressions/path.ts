import type { ContextSegment, Expression, FieldExpression, FilterSegment, IndexSegment, PathExpression, PathSegment, ReduceSegment, SortSegment } from '../../parser/expression.type';
import { Range } from '../../Range';
import type { SimpleArray, SimpleObject, SimpleValue } from '../../SimpleValue.type';
import { eval_any_expr, ExpressionEnvironment, extended_typeof } from '../expression';

export type Sequence = SimpleArray;

export function eval_path_expr(ctx: ExpressionEnvironment, expr: PathExpression, value: SimpleValue): SimpleValue {
  const head_value = expr.head ? eval_any_expr(ctx, expr.head, value) : value;

  if (head_value === undefined) {
    return undefined;
  }

  return eval_path_sequence(ctx, expr.segments, [head_value]);
}

export function eval_path_sequence(ctx: ExpressionEnvironment, segments: PathSegment[], sequence: Sequence): SimpleValue {
  for (const op of segments) {
    sequence = eval_path_segment(ctx, op, sequence);
    if (sequence.length === 0) {
      return undefined;
    }
  }

  return flatten_sequence(sequence);
}

export function eval_path_segment(ctx: ExpressionEnvironment, op: PathSegment, sequence: Sequence): Sequence {
  switch (op.type) {
    case 'filter':
      return eval_filter_op(ctx, op, sequence);
    case 'reduce':
      return eval_reduce_op(ctx, op, sequence);
    case 'sort':
      return eval_sort_op(ctx, op, sequence);
    case 'field_expression':
      return eval_field_op(op, sequence);
    case 'wildcard_expression':
      return eval_wild_op(false, sequence);
    case 'descendant_expression':
      return eval_wild_op(true, sequence);
    default:
      return eval_generic_op(ctx, op, sequence);
      // NOTE these segments recurse 
    case 'index':
      return eval_index_op(ctx, op, sequence);
    case 'context':
      return eval_context_op(ctx, op, sequence);
  }
}

export function eval_filter_op(ctx: ExpressionEnvironment, expr: FilterSegment, sequence: Sequence): Sequence {
  const result: SimpleValue[] = [];

  const match = (val: SimpleValue, i: number, l: number): boolean => {
    const predicate = eval_any_expr(ctx, expr.expression, val);
    if (predicate instanceof Range) {
      return predicate.includes(i);
    }

    if (typeof predicate === 'number') {
      return Math.floor(predicate < 0 ? l + predicate : predicate) === i;
    }

    // TODO better truthiness here
    return predicate === true;
  };

  for (const value of sequence) {
    const value_array = Array.isArray(value) ? value : [value];
    for (let i = 0; i < value_array.length; i += 1) {
      if (match(value_array[i], i, value_array.length)) {
        result.push(value_array[i]);
      }
    }
  }

  return result;
}

export function eval_reduce_op(ctx: ExpressionEnvironment, expr: ReduceSegment, sequence: Sequence): Sequence {
  const result: SimpleObject = {};
  const flat_sequence = Array.from(flatten(sequence));

  for (const kv_expr of expr.elements) {
    const key_results: Record<string, SimpleValue[]> = {};

    for (const next of flat_sequence) {
      const key = eval_any_expr(ctx, kv_expr.key, next);
      if (key === undefined) {
        continue;
      }
      if (typeof key !== 'string') {
        throw new Error(`Key in object structure must evaluate to a string; got: ${extended_typeof(key)}`); // TODO improve message
      }
      if (key in result) {
        throw new Error(`Multiple key definitions evaluate to same key: "${key}"`); // TODO improve message
      }

      const existing_result = key_results[key];
      if (existing_result) {
        existing_result.push(next);
      } else {
        key_results[key] = [next];
      }
    }

    for (const [key, value] of Object.entries(key_results)) {
      const value_expr_result = eval_any_expr(ctx, kv_expr.value, value);
      if (value_expr_result === undefined) {
        continue;
      }
      result[key] = value_expr_result;
    }
  }

  return [result];
}

export function eval_sort_op(_ctx: ExpressionEnvironment, _expr: SortSegment, _sequence: Sequence): Sequence {
  throw new Error('NOT IMPLEMENTED');
}

export function eval_index_op(ctx: ExpressionEnvironment, op: IndexSegment, sequence: Sequence): Sequence {
  const output = [];

  for (const value of sequence) {
    const scope = { ...ctx };
    const value_array = Array.isArray(value) ? value : [value];
    for (let i = 0; i < value_array.length; i += 1) {
      scope[op.symbol] = i;
      const result = eval_path_sequence(scope, op.segments, [value_array[i]]);
      if (result) {
        output.push(result);
      }
    }
  }
  return output;
}

export function eval_context_op(ctx: ExpressionEnvironment, op: ContextSegment, sequence: Sequence): Sequence {

  // for each item in sequence evaluate the expression
  // for each result in the expression run the path sequence using the parent item as context and the result bound to the symbol
  // concatenate all the sequence results into a single sequence

  const output = [];

  for (const item of sequence.flat()) {
    const intermediate = eval_path_segment(ctx, op.expression, [item]);
    const scope = { ...ctx };
    for (const elem of intermediate.flat()) {
      scope[op.symbol] = elem;
      const result = eval_path_sequence(scope, op.segments, [item]);
      if (result) {
        output.push(result);
      }
    }
  }
  return output;
}

export function eval_field_expr(expr: FieldExpression, value: SimpleValue): SimpleValue {
  let sequence = [value];
  sequence = eval_field_op(expr, sequence);
  return flatten_sequence(sequence);
}

export function eval_wild_expr(descend: boolean, value: SimpleValue): SimpleValue {
  let sequence = [value];
  sequence = eval_wild_op(descend, sequence);
  return flatten_sequence(sequence);
}

export function eval_parent_expr(): never {
  throw new Error('NOT IMPLEMENTED');
}

export function eval_wild_op(descend: boolean, sequence: SimpleArray): SimpleArray {
  let result: SimpleValue[] = [];
  while (sequence.length) {
    // pop value from stack
    const next = sequence.pop()!;
    if (Array.isArray(next)) {
      // push back array items
      sequence = sequence.concat(next);
    }
    else if (next instanceof Range || !next) {
      // skip non-dictionary items
      continue;
    }
    else if (typeof next === 'object') {
      const values = Object.values(next);
      if (descend) {
        sequence = sequence.concat(values);
      }
      // NOTE order of results might wrong, sorry
      result = values.concat(result);
    }
  }
  return result;
}

export function eval_field_op(expr: FieldExpression, sequence: SimpleArray): SimpleArray {
  const result: SimpleValue[] = [];
  while (sequence.length) {
    // pop value from stack
    const next = sequence.pop()!;
    if (Array.isArray(next)) {
      // push back array items
      sequence = sequence.concat(next);
    }
    else if (next instanceof Range || !next) {
      // skip non-dictionary items
      continue;
    }
    else if (typeof next === 'object' && expr.value in next) {
      const value = next[expr.value];
      result.unshift(value);
    }
  }
  return result;
}

export function eval_generic_op(ctx: ExpressionEnvironment, expr: Expression, sequence: SimpleArray): SimpleArray {
  const result: SimpleArray = [];
  for (const val of sequence.flat()) {
    const el = eval_any_expr(ctx, expr, val);
    if (el !== undefined) {
      result.push(el);
    }
  }
  return result;
}

export function flatten_sequence(sequence: SimpleArray): SimpleValue {
  if (sequence.length === 0) {
    return undefined;
  }

  const flat = sequence = sequence.flat();

  return flat.length === 1 ? flat[0] : flat;
}

export function* flatten(arr: SimpleArray): Iterable<SimpleValue> {
  while (arr.length) {
    // pop value from stack
    const next = arr.shift()!;
    if (Array.isArray(next)) {
      // push back array items
      arr.unshift(...next);
    }
    else {
      // yield non array values
      yield next;
    }
  }
}