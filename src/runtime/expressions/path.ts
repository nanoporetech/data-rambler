import type { FieldExpression, FilterSegment, IndexSegment, MapSegment, PathExpression, PathSegment, ReduceExpression, SortSegment } from '../../parser/expression.type';
import { Range } from '../../Range';
import type { SimpleArray, SimpleObject, SimpleValue } from '../../SimpleValue.type';
import { eval_any_expr, ExpressionEnvironment, extended_typeof } from '../expression';

export type Sequence = Iterable<SimpleValue>

export function wrap_array(value: SimpleValue): SimpleArray {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [ value ];
}

export function unwrap_array(value: SimpleArray): SimpleValue {
  return value.length > 1 ? value : value[0]; 
}

export function eval_path_expr(ctx: ExpressionEnvironment, seg: PathExpression, value: SimpleValue): SimpleValue {
  const source = eval_any_expr(ctx, seg.head, value);
  const result = eval_path_segment(ctx, seg.next, wrap_array(source));

  return unwrap_array(Array.from(result));
}

export function eval_path_segment(ctx: ExpressionEnvironment, seg: PathSegment, sequence: SimpleArray): Sequence {
  switch (seg.type) {
    case 'filter':
      return eval_filter_segment(ctx, seg, sequence);
    case 'map':
      return eval_map_segment(ctx, seg, sequence);
    case 'sort':
      return eval_sort_segment(ctx, seg, sequence);
    case 'index':
      return eval_index_segment(ctx, seg, sequence);
  }
}

export function match_filter_predicate(predicate: SimpleValue, i: number, l: number): boolean {
  
  if (predicate instanceof Range) {
    return predicate.includes(i);
  }
  
  if (typeof predicate === 'number') {
    return Math.floor(predicate < 0 ? l + predicate : predicate) === i;
  }
  
  // TODO better truthiness here
  return predicate === true;
}

export function* eval_filter_segment(ctx: ExpressionEnvironment, seg: FilterSegment, sequence: SimpleArray): Sequence {    
  const items = sequence.flat();

  for (let i = 0, l = items.length; i < l; i += 1) {
    const val = items[i];
    const predicate = eval_any_expr(ctx, seg.expression, val);

    if (!match_filter_predicate(predicate, i, l)) {
      continue;
    }

    if (seg.next) {
      yield* eval_path_segment(ctx, seg.next, wrap_array(val));
    } else {
      yield val;
    }
  }     
}

export function* eval_map_segment(ctx: ExpressionEnvironment, expr: MapSegment, sequence: SimpleArray): Sequence {
  const { symbol } = expr;
  const scope = symbol ? { ... ctx } : ctx;

  for (const value of flatten(sequence)) {

    const elem = eval_any_expr(ctx, expr.expression, value);

    if (!elem || Array.isArray(elem) && elem.length === 0) {
      continue;
    }

    // for (const elem of intermediate) {

    if (!expr.next) {
      yield symbol ? value : elem;
      continue;
    }
    
    // NOTE when using a context symbol we actually emit the source value instead of the element
    // each element is bound to it's variable and then the parent is emitted again
    // this allows for binding multiple parts of an object ( but isn't particularly performant )
    if (symbol !== null) {
      scope[symbol] = elem;
      yield* eval_path_segment(scope, expr.next, wrap_array(value));
    } else {
      // TODO can elem be undefined?
      yield* eval_path_segment(scope, expr.next, wrap_array(elem));
    }
  }
  // }
}

export function eval_sort_segment(_ctx: ExpressionEnvironment, _seg: SortSegment, _sequence: SimpleArray): Sequence {
  throw new Error('not implemented');
}

export function* eval_index_segment(ctx: ExpressionEnvironment, seg: IndexSegment, sequence: SimpleArray): Sequence {
  const { symbol } = seg;
  const scope = { ...ctx }; // NOTE create a child scope!

  if (!seg.next) {
    return sequence;
  }

  for (const value of flatten(sequence)) {
    let i = 0;

    scope[symbol] = i;
    i += 1;

    yield* eval_path_segment(scope, seg.next, [value]);
  }
}

// export function eval_path_sequence(ctx: ExpressionEnvironment, expr: PathExpression, value: SimpleValue): Sequence {
//   const { left, right } = expr;
//   let sequence: Iterable<SimpleValue>;
//   if (left.type === 'path_expression') {
//     sequence = eval_path_sequence(ctx, left, value);
//   } else {
//     sequence = wrap_array(eval_any_expr(ctx, left, value));
//   }

//   switch (right.type) {
//     case 'map':
//       return eval_map_op(ctx, right, sequence);
//     case 'sort':
//       return eval_sort_op(ctx, right, sequence);
//     case 'filter':
//       return eval_filter_op(ctx, right, sequence);
//     default:
//       throw new Error('Generic RHS');
//   }
// }


// export function* eval_filter_op(ctx: ExpressionEnvironment, expr: FilterSegment, sequence: Sequence): Sequence {
//   const match = (val: SimpleValue, i: number, l: number): boolean => {
//     // NOTE this technically pollutes the scope a little, indices become scoped to the current path expression
//     // instead of from this segment deeper
//     if (expr.index_symbol) {
//       ctx[expr.index_symbol] = i;
//     }

//     const predicate = eval_any_expr(ctx, expr.expression, val);
//     if (predicate instanceof Range) {
//       return predicate.includes(i);
//     }

//     if (typeof predicate === 'number') {
//       return Math.floor(predicate < 0 ? l + predicate : predicate) === i;
//     }

//     // TODO better truthiness here
//     return predicate === true;
//   };

//   // const wrapped_sequence: SimpleArray | Sequence = Array.isArray(sequence) ? [ sequence ] : sequence;

//   let sequence_index = 0;
//   const sequence_length = Array.isArray(sequence) ? sequence.length : 0;

//   for (const element of sequence) {
//     if (Array.isArray(element)) {
//       for (let i = 0, l = element.length; i < l; i += 1) {
//         if (match(element[i], i, l)) {
//           yield element[i];
//         }
//       }
//     } else if (match(element, sequence_index, sequence_length)) {
//       yield element;
//     }

//     sequence_index += 1;
//   }
// }

// export function* eval_map_op(ctx: ExpressionEnvironment, expr: MapSegment, sequence: Sequence): Sequence {
//   const { symbol: context_symbol, index_symbol } = expr;

//   for (const value of flatten(sequence)) {
//     let i = 0;

//     const intermediate = wrap_array(eval_any_expr(ctx, expr.expression, value)).flat();

//     for (const elem of intermediate) {
//       if (index_symbol !== null) { 
//         ctx[index_symbol] = i;
//         i += 1;
//       }
//       // NOTE when using a context symbol we actually emit the source value instead of the element
//       // each element is bound to it's variable and then the parent is emitted again
//       // this allows for binding multiple parts of an object ( but isn't particularly performant )
//       if (context_symbol !== null) {
//         ctx[context_symbol] = elem;
//         yield value; 
//       } else {
//       // TODO can elem be undefined?
//         yield elem;
//       }
//     }
//   }  
// }

export function eval_reduce_expression(ctx: ExpressionEnvironment, expr: ReduceExpression, value: SimpleValue): SimpleValue {
  const result: SimpleObject = {};
  const flat_sequence = wrap_array(eval_any_expr(ctx, expr.expression, value));

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

  return result;
}

export function eval_sort_op(_ctx: ExpressionEnvironment, _expr: SortSegment, _sequence: Sequence): Sequence {
  throw new Error('NOT IMPLEMENTED');
}

export function eval_field_expr(expr: FieldExpression, value: SimpleValue): SimpleValue {
  let sequence = [value];
  const result = [];

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

  return unwrap_array(result);
}

export function eval_wild_expr(descend: boolean, value: SimpleValue): SimpleValue {
  let sequence = wrap_array(value);
  let result: SimpleArray = [];

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
    } else {
      result.unshift(next);
    }
  }

  return unwrap_array(result);
}

export function eval_parent_expr(): never {
  throw new Error('NOT IMPLEMENTED');
}

export function* flatten(source: Iterable<SimpleValue>): Iterable<SimpleValue> {
  for (const el of source) {
    if (Array.isArray(el)) {
      yield* flatten(el);
    } else {
      yield el;
    }
  }
}