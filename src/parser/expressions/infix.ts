import { syntax_error } from '../../scanner/error';
import { parse_expression } from '../expression';
import type { AssignmentExpression, BinaryExpression, CallExpression, ComputedPropertyExpression, ConditionalExpression, Expression, FunctionExpression, PropertyExpression, WildExpression } from '../expression.type';
import { consume_token, ensure_token, join_fragments, match_token } from '../parser_context';
import type { ParserContext } from '../parser_context.type';
import { parse_expression_sequence } from './prefix';

export function parse_binary_expression<T extends `${string}_expression`> (type: T, ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<T> {
  const right = parse_expression(ctx, precedence);

  return {
    type, left, right, fragment: join_fragments(left.fragment, right.fragment)
  };
}

export function parse_assignment_expression (ctx: ParserContext, left: Expression, precedence: number): AssignmentExpression {
  ensure_token(ctx, 'symbol', ':');
  ensure_token(ctx, 'symbol', '=');

  // TODO can we support destructuring here?
  if (left.type !== 'identifier_expression') {
    syntax_error('Invalid left-hand side in assignment', left.fragment);
  }

  const expression = parse_expression(ctx, precedence - 1);

  return {
    type: 'assignment_expression',
    symbol: left.value,
    expression,
    fragment: join_fragments(left.fragment, expression.fragment),
  };
}

export function parse_property_expression (ctx: ParserContext, left: Expression): PropertyExpression {
  ensure_token(ctx, 'symbol', '.');

  const { fragment: end, value: symbol } = ensure_token(ctx, 'identifier');
  
  return {
    type: 'property_expression',
    left,
    fragment: join_fragments(left.fragment, end),
    symbol,
  };
}

export function parse_computed_property_expression (ctx: ParserContext, left: Expression): ComputedPropertyExpression {
  ensure_token(ctx, 'symbol', '[');

  const expr = parse_expression(ctx);
  const { fragment: end } = ensure_token(ctx, 'symbol', ']');

  return {
    type: 'computed_property_expression',
    left,
    fragment: join_fragments(left.fragment, end),
    field: expr,
  };
}

export function parse_wild_expression (ctx: ParserContext, left: Expression): WildExpression {
  ensure_token(ctx, 'symbol', '.');
  const { fragment: end } = ensure_token(ctx, 'symbol', '*');
  
  return {
    type: 'wild_expression',
    left,
    fragment: join_fragments(left.fragment, end),
  };
}

export function parse_range_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'range_expression'> {
  ensure_token(ctx, 'symbol', '.');
  ensure_token(ctx, 'symbol', '.');

  return parse_binary_expression('range_expression', ctx, left, precedence); // we might want the precedence of this to be higher
}

export function parse_conditional_expression (ctx: ParserContext, condition: Expression, precedence: number): ConditionalExpression {
  ensure_token(ctx, 'symbol', '?');

  const then_expression = parse_expression(ctx, precedence);
  let end = then_expression.fragment;
  let else_expression = null;

  if (match_token(ctx, 'symbol', ':')) {
    consume_token(ctx);
    else_expression = parse_expression(ctx, precedence);
    end = else_expression.fragment;
  }

  return {
    type: 'conditional_expression',
    fragment: join_fragments(condition.fragment, end),
    condition,
    then_expression,
    else_expression,
  };
}

export function parse_call_expression (ctx: ParserContext, callee: Expression): CallExpression {
  const { elements, fragment: end } = parse_expression_sequence(ctx, ['(', ')'], 1); // ensure don't parse comma expression
  return {
    type: 'call_expression',
    fragment: join_fragments(callee.fragment, end),
    callee: callee,
    arguments: elements,
  };
}

export function parse_chain_expression (ctx: ParserContext, left: Expression, precedence: number): BinaryExpression<'chain_expression'> {
  ensure_token(ctx, 'symbol', '|');
  ensure_token(ctx, 'symbol', '>');

  // TODO rework the chain expression to be sugar for call expressions
  const right = parse_expression(ctx, precedence);

  // NOTE the right hand side should resolve to a function or a function call expression

  return {
    type: 'chain_expression',
    fragment: join_fragments(left.fragment, right.fragment),
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

export function resolve_parameters(expr: Expression): string[] {
  if (expr.type === 'identifier_expression') {
    return [ expr.value ];
  }
  if (expr.type === 'group_expression') {
    return expr.expression ? unwrap_comma(expr.expression) : [];
  }
  syntax_error('Malformed arrow function parameter list', expr.fragment);
}

export function unwrap_comma (expr: Expression): string[] {
  if (expr.type === 'comma_expression') {
    return [...unwrap_comma(expr.left), ...unwrap_comma(expr.right)];
  }
  if (expr.type === 'identifier_expression') {
    return [expr.value];
  }
  syntax_error('Malformed arrow function parameter list', expr.fragment);
}

export function parse_function_expression(ctx: ParserContext, left: Expression): FunctionExpression {
  const parameters = resolve_parameters(left);
  const body = parse_expression(ctx); // WARN what precedence should this be?
  const fragment = join_fragments(left.fragment, body.fragment);

  return {
    type: 'function_expression',
    fragment,
    parameters,
    body
  };
}