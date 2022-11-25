import type { FieldSegment, FilterSegment, IndexSegment, MapSegment, PathExpression, PathSegment, ReduceExpression, SortSegment, WildcardSegment } from '../../parser/expression.type';
import { Range } from '../../Range';
import type { SimpleArray, SimpleObject, SimpleValue } from '../../SimpleValue.type';
import { eval_any_expr, ExpressionEnvironment, extended_typeof } from '../expression';


type StackResolver = (el: SimpleValue, stack: LIFOStack) => readonly SimpleValue[] | undefined;
class LIFOStack {
  private contents: SimpleArray;
  constructor (initial: Sequence = []) {
    this.contents = initial.slice(0);
  }

  add (value: SimpleValue): void {
    this.contents.unshift(value);
  }
  add_multiple (values: SimpleValue[]): void {
    let i = values.length;
    while (i--) {
      this.contents.unshift(values[i]);
    }
  }
  resolve (cb: StackResolver): SimpleArray {
    const results = [];

    while (this.contents.length > 0) {
      const next = this.contents.shift();
      const match = cb(next, this);
      if (!match) {
        continue;
      }
      for (const el of match) {
        results.push(el);
      }
    }

    return results;
  }
}

export type Sequence = readonly SimpleValue[];

export function wrap_array(value: SimpleValue | Sequence): Sequence {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [ value ] as Sequence;
}

export function unwrap_array(value: Sequence): SimpleValue {
  return value.length > 1 ? (value as SimpleArray) : value[0]; 
}

export function eval_path_expr(ctx: ExpressionEnvironment, seg: PathExpression, value: SimpleValue): SimpleValue {
  const source = eval_any_expr(ctx, seg.head, value);
  const result = eval_path_segment(ctx, seg.next, source);

  return unwrap_array(result);
}

export function eval_path_segment(ctx: ExpressionEnvironment, seg: PathSegment, value: SimpleValue): Sequence {
  switch (seg.type) {
    case 'filter':
      return eval_filter_segment(ctx, seg, value);
    case 'map':
      return eval_map_segment(ctx, seg, value);
    case 'sort':
      return eval_sort_segment(ctx, seg, value); 
    case 'index':
      return eval_index_segment(ctx, seg, value);
    case 'field':
      return eval_field_segment(ctx, seg, value);
    case 'wild':
      return eval_wild_segment(ctx, seg, value);
  }
}

export function eval_next_path_segment(ctx: ExpressionEnvironment, seg: PathSegment, value: SimpleValue | Sequence, ctx_binder?: (value: SimpleValue, ctx: ExpressionEnvironment) => SimpleValue): Sequence {
  const intermediate = wrap_array(value);

  if (!seg.next || intermediate.length === 0) {
    return intermediate;
  }

  const results: Sequence[] = [];
  const scope = ctx_binder ? { ...ctx } : ctx;

  for (const elem of intermediate) {
    const value = ctx_binder ? ctx_binder(elem, scope) : elem;
    results.push(eval_path_segment(scope, seg.next, value));
  }
 
  return results.flat();
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

export function eval_filter_segment(ctx: ExpressionEnvironment, seg: FilterSegment, value: SimpleValue): Sequence {    
  const list = wrap_array(value);
  const { length } = list;

  if (length === 0) {
    return list;
  }

  const intermediate = list.filter((value, index) => {
    return match_filter_predicate(eval_any_expr(ctx, seg.expression, value), index, length);
  });

  return eval_next_path_segment(ctx, seg, intermediate);
}

export function eval_map_segment(ctx: ExpressionEnvironment, seg: MapSegment, value: SimpleValue): Sequence {
  const intermediate = eval_any_expr(ctx, seg.expression, value);
  return eval_next_path_segment(ctx, seg, flatten(wrap_array(intermediate)));
}

export function eval_sort_segment(_ctx: ExpressionEnvironment, _seg: SortSegment, _value: SimpleValue): Sequence {
  throw new Error('not implemented');
}

export function eval_index_segment(ctx: ExpressionEnvironment, seg: IndexSegment, value: SimpleValue): Sequence {
  const { symbol } = seg;
  let index = 0;

  const binder = (_el: SimpleValue, ctx: ExpressionEnvironment) => {
    ctx[symbol] = index++;
    return value;
  };

  return eval_next_path_segment(ctx, seg, value, binder);
}

export function eval_reduce_expression(ctx: ExpressionEnvironment, expr: ReduceExpression, value: SimpleValue): SimpleValue {

  // TODO probably borked

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

export function eval_sort_op(_ctx: ExpressionEnvironment, _expr: SortSegment, _sequence: readonly SimpleValue[]): Sequence {
  throw new Error('NOT IMPLEMENTED');
}

export function eval_field_segment(ctx: ExpressionEnvironment, seg: FieldSegment, source: SimpleValue): Sequence {
  const stack = new LIFOStack([ source ]);

  const matches = stack.resolve((next) => {
    if (next instanceof Range || next === null) {
      return;
    }

    if (Array.isArray(next)) {
      // push back array items
      stack.add_multiple(next);
      return;
    }

    if (typeof next === 'object' && seg.symbol in next) {
      return [next[seg.symbol]];
    }
    return;
  });

  const { context } = seg;
  let binder;
  if (context) {
    binder = (el: SimpleValue, ctx: ExpressionEnvironment) => {
      ctx[context] = el;
      return source;
    };
  }

  return eval_next_path_segment(ctx, seg, matches, binder);
}

export function eval_wild_segment(ctx: ExpressionEnvironment, seg: WildcardSegment, value: SimpleValue): Sequence {
  const stack = new LIFOStack([ value ]);

  const intermediate = stack.resolve((next) => {
    if (next instanceof Range || next === null) {
      return;
    }

    if (Array.isArray(next)) {
      // push back array items
      stack.add_multiple(next);
      return;
    }

    if (typeof next === 'object') {
      const values = Object.values(next);
      if (seg.descend) {
        stack.add_multiple(values);
      }
      return values.flat();
    }

    return wrap_array(next);
  });

  return eval_next_path_segment(ctx, seg, intermediate);
}

export function flatten(source: Sequence): Sequence {
  const stack = new LIFOStack(source);

  return stack.resolve((next) => {
    if (Array.isArray(next)) {
      stack.add_multiple(next);
      return;
    }
    return [ next ];
  });
}