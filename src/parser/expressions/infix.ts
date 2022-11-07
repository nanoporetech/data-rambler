import { parse_expression } from '../expression';
import type { AssignmentExpression, BinaryExpression, CallExpression, ConditionalExpression, ContextSegment, Expression, FilterSegment, IndexSegment, PathExpression, PathSegment, ReduceSegment, SortSegment } from '../expression.type';
import { consume_token, ensure_token, match_token, peek_token, previous_token, tokens_remaining } from '../parser_context';
import type { ParserContext } from '../parser_context.type';
import { parse_sequence } from '../sequence';
import { parse_expression_sequence, parse_object_literal } from './prefix';

export function parse_binary_expression<T extends `${string}_expression`> (type: T, ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<T> {
  const { start } = left;
  const right = parse_expression(ctx, precedence);
  const { end } = right;

  return {
    type, left, right, start, end
  };
}

export function parse_assignment_expression (ctx: ParserContext, left: Expression, precedence: number): AssignmentExpression {
  ensure_token(ctx, 'symbol', ':');
  ensure_token(ctx, 'symbol', '=');

  if (left.type !== 'identifier_expression') {
    throw new SyntaxError('Invalid left-hand side in assignment'); // TODO add position data
  }

  const { start }  = left;
  const expression = parse_expression(ctx, precedence - 1);
  const { end } = expression;

  return {
    type: 'assignment_expression',
    symbol: left.value,
    expression,
    start,
    end
  };
}

export function parse_path_expression(ctx: ParserContext, left: Expression, precedence: number): PathExpression {
  const { start } = left;
  const segments: PathSegment[] = [];
  let head: Expression | null = attempt_unwrap_quoted_field(left);

  if (head.type === 'field_expression' || head.type === 'wildcard_expression' || head.type === 'descendant_expression') {
    segments.push(head);
    head = null;
  }

  segments.push(...parse_path_segments(ctx, precedence));

  const { end } = previous_token(ctx);

  return {
    type: 'path_expression',
    head,
    segments,
    start,
    end
  }; 
}

export function parse_path_segments (ctx: ParserContext, precedence: number): PathSegment[] {
  const segments: PathSegment[] = [];
  while (tokens_remaining(ctx)) {
    const segment = parse_path_segment(ctx, precedence);
    if (!segment) {
      break;
    }
    segments.push(segment);
  }
  return segments;
}

function parse_path_segment (ctx: ParserContext, precedence: number): PathSegment | null {
  const next = peek_token(ctx);
  if (!next || next.type !== 'symbol') {
    return null;
  }

  switch (next.value) {
    case '[': return parse_filter_segment(ctx);
    case '{': return parse_reduce_segment(ctx);
    case '^': return parse_sort_segment(ctx);
    case '#': return parse_index_segment(ctx, precedence);
    case '.': return parse_map_segment(ctx, precedence);
  }
  return null;
}

export function parse_map_segment (ctx: ParserContext, precedence: number): PathSegment {
  ensure_token(ctx, 'symbol', '.');
  const expr =  attempt_unwrap_quoted_field(parse_expression(ctx, precedence));

  const next = peek_token(ctx);

  // NOTE we only support index/context binding after a map operations
  // this is supported in the parser as "upgrading" a map segment to a index/context segment

  switch (next?.type === 'symbol' && next.value) {
    case '@': return parse_context_segment(ctx, expr, precedence);
  }

  return expr;
}

export function attempt_unwrap_quoted_field (expr: Expression): Expression {
  if (expr.type === 'json_expression' && typeof expr.value === 'string') {
    const { start, end, value } = expr;
    return { type: 'field_expression', start, end, value };
  }
  return expr;
}

export function parse_filter_segment (ctx: ParserContext): FilterSegment {
  const { start } = ensure_token(ctx, 'symbol', '[');
  const expression = parse_expression(ctx); // default precedence inside the brackets
  const { end } = ensure_token(ctx, 'symbol', ']');

  return {
    type: 'filter', expression, start, end
  };
}

export function parse_reduce_segment (ctx: ParserContext): ReduceSegment {
  const { start, end, elements } = parse_object_literal(ctx);
  
  return {
    type: 'reduce',
    start,
    end,
    elements
  };
}

export function parse_index_segment (ctx: ParserContext, precedence: number): IndexSegment {
  const { start } = ensure_token(ctx, 'symbol', '#');
  const { value, end } = ensure_token(ctx, 'identifier');
  if (!value.startsWith('$')) {
    throw new Error('The left side of := must be a variable name (start with $)');
  }
  const symbol = value.slice(1);
  // NOTE to aid in path evaluation any segments after a index segment are considered
  // a child path expression
  const segments = parse_path_segments(ctx, precedence);

  return {
    type: 'index',
    start,
    end,
    segments,
    symbol
  };
}

export function parse_context_segment (ctx: ParserContext, expression: Expression, precedence: number): ContextSegment {
  const { start } = ensure_token(ctx, 'symbol', '@');
  const { value, end } = ensure_token(ctx, 'identifier');
  if (!value.startsWith('$')) {
    throw new Error('The left side of := must be a variable name (start with $)');
  }
  const symbol = value.slice(1);
  // NOTE to aid in path evaluation any segments after a context segment are considered
  // a child path expression
  const segments = parse_path_segments(ctx, precedence);

  return {
    type: 'context',
    start,
    end,
    expression,
    segments,
    symbol
  };
}

export function parse_sort_segment (ctx: ParserContext): SortSegment {
  const { start } = ensure_token(ctx, 'symbol', '^');
  const { end, elements } = parse_sequence(ctx, ['(', ')'], ctx => {
    let ascending = true; // default to ascending order

    if (match_token(ctx, 'symbol', '>')) { // descending
      consume_token(ctx);
      ascending = false;
    }
    else if (match_token(ctx, 'symbol', '<')) { // explicit ascending
      consume_token(ctx); 
    }

    const expression = parse_expression(ctx); // default precedence

    return {
      ascending,
      expression
    };
  });
  
  return {
    type: 'sort',
    start,
    end,
    elements
  };
}



export function parse_range_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'range_expression'> {
  ensure_token(ctx, 'symbol', '.');
  ensure_token(ctx, 'symbol', '.');

  return parse_binary_expression('range_expression', ctx, left, precedence); // we might want the precedence of this to be higher
}

export function parse_conditional_expression (ctx: ParserContext, left: Expression, precedence: number): ConditionalExpression {
  const { start } = left;

  ensure_token(ctx, 'symbol', '?');

  const then_expression = parse_expression(ctx, precedence);
  let end = then_expression.end;
  let else_expression = null;

  if (match_token(ctx, 'symbol', ':')) {
    consume_token(ctx);
    else_expression = parse_expression(ctx, precedence);
    end = else_expression.end;
  }

  return {
    type: 'conditional_expression',
    start, 
    end,
    condition: left,
    then_expression,
    else_expression,
  };
}

export function parse_call_expression (ctx: ParserContext, callee: Expression, _precedence: number): CallExpression {
  const { start } = callee;
  const { elements, end } = parse_expression_sequence(ctx, ['(', ')'], 1); // ensure don't parse comma expression
  return {
    type: 'call_expression',
    start,
    end,
    callee: callee,
    arguments: elements,
  };
}

export function parse_chain_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'chain_expression'> {
  const { start } = left;
  ensure_token(ctx, 'symbol', '~');
  ensure_token(ctx, 'symbol', '>');

  const right = parse_expression(ctx, precedence);
  const { end } = right; 

  // NOTE the right hand side should resolve to a function or a function call expression

  return {
    type: 'chain_expression',
    start,
    end,
    left,
    right,
  };
}

export function parse_comma_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'comma_expression'> {
  ensure_token(ctx, 'symbol', ',');

  return parse_binary_expression('comma_expression', ctx, left, precedence);
}

export function parse_add_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'add_expression'> {
  ensure_token(ctx, 'symbol', '+');
	
  return parse_binary_expression('add_expression', ctx, left, precedence);
}

export function parse_concat_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'concat_expression'> {
  ensure_token(ctx, 'symbol', '&');
	
  return parse_binary_expression('concat_expression', ctx, left, precedence);
}

export function parse_subtract_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'subtract_expression'> {
  ensure_token(ctx, 'symbol', '-');

  return parse_binary_expression('subtract_expression', ctx, left, precedence);
}

export function parse_multiply_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'multiply_expression'> {
  ensure_token(ctx, 'symbol', '*');

  return parse_binary_expression('multiply_expression', ctx, left, precedence);
}

export function parse_divide_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'divide_expression'> {
  ensure_token(ctx, 'symbol', '/');

  return parse_binary_expression('divide_expression', ctx, left, precedence);
}

export function parse_logical_and_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'logical_and_expression'> {
  ensure_token(ctx, 'identifier', 'and');

  return parse_binary_expression('logical_and_expression', ctx, left, precedence);
}

export function parse_logical_or_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'logical_or_expression'> {
  ensure_token(ctx, 'identifier', 'or');

  return parse_binary_expression('logical_or_expression', ctx, left, precedence);
}

export function parse_logical_in_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'logical_in_expression'> {
  ensure_token(ctx, 'identifier', 'in');

  return parse_binary_expression('logical_in_expression', ctx, left, precedence);
}

export function parse_equals_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'equals_expression'> {
  ensure_token(ctx, 'symbol', '=');

  return parse_binary_expression('equals_expression', ctx, left, precedence);
}

export function parse_not_equals_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'not_equals_expression'> {
  ensure_token(ctx, 'symbol', '!');
  ensure_token(ctx, 'symbol', '=');

  return parse_binary_expression('not_equals_expression', ctx, left, precedence);
}

export function parse_less_than_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'less_than_expression'> {
  ensure_token(ctx, 'symbol', '<');

  return parse_binary_expression('less_than_expression', ctx, left, precedence);
}

export function parse_greater_than_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'greater_than_expression'> {
  ensure_token(ctx, 'symbol', '>');

  return parse_binary_expression('greater_than_expression', ctx, left, precedence);
}

export function parse_less_than_or_equals_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'less_than_or_equals_expression'> {
  ensure_token(ctx, 'symbol', '<');
  ensure_token(ctx, 'symbol', '=');

  return parse_binary_expression('less_than_or_equals_expression', ctx, left, precedence);
}

export function parse_greater_than_or_equals_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'greater_than_or_equals_expression'> {
  ensure_token(ctx, 'symbol', '>');
  ensure_token(ctx, 'symbol', '=');

  return parse_binary_expression('greater_than_or_equals_expression', ctx, left, precedence);
}

export function parse_remainder_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'remainder_expression'> {
  ensure_token(ctx, 'symbol', '%');

  return parse_binary_expression('remainder_expression', ctx, left, precedence);
}

export function parse_coalescing_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'coalescing_expression'> {
  ensure_token(ctx, 'symbol', '?');
  ensure_token(ctx, 'symbol', '?');

  return parse_binary_expression('coalescing_expression', ctx, left, precedence);
}

export function parse_exponentiation_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'exponentiation_expression'> {
  ensure_token(ctx, 'symbol', '*');
  ensure_token(ctx, 'symbol', '*');

  return parse_binary_expression('exponentiation_expression', ctx, left, precedence);
}