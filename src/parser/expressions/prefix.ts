import { consume_token, ensure_token, join_fragments, match_token, peek_token } from '../parser_context';

import type { ParserContext } from '../parser_context.type';
import type { JSONArray, JSONObject, JSONValue } from '../../JSON.type'; 
import { parse_sequence } from '../sequence';
import { unexpected_end_of_input, unexpected_token } from '../../scanner/error';
import { parse_expression } from '../expression';
import type { Sequence } from '../sequence.type';
import type { ArrayExpression, Expression, GroupExpression, IdentifierExpression, JSONExpression, ObjectExpression, SimplePrefixExpression } from '../expression.type';

export function parse_expression_sequence (ctx: ParserContext, delimiter: [string, string], precedence = 0): Sequence<Expression> {
  return parse_sequence(ctx, delimiter, ctx => parse_expression(ctx, precedence));
}

export function parse_number_literal(ctx: ParserContext): JSONExpression {
  const { value, fragment } = consume_token(ctx);
  return { type: 'json_expression', fragment, value: Number(value) };
}

export function parse_string_literal(ctx: ParserContext): JSONExpression {
  const { value, fragment } = consume_token(ctx);
  return { type: 'json_expression', fragment, value };
}

export function parse_boolean_literal(ctx: ParserContext): JSONExpression {
  const { value, fragment } = consume_token(ctx);
  return { type: 'json_expression', fragment, value: value === 'true' };
}

export function parse_identifier_literal(ctx: ParserContext): IdentifierExpression {
  const { value, fragment } = consume_token(ctx);
  return { type: 'identifier_expression', fragment, value };
}

export function parse_null_literal(ctx: ParserContext): JSONExpression {
  const { fragment } = consume_token(ctx);
  return { type: 'json_expression', fragment, value: null };
}

export function parse_undefined_literal(ctx: ParserContext): JSONExpression {
  const { fragment } = consume_token(ctx);
  return { type: 'json_expression', fragment, value: undefined };
}

export function parse_object_literal(ctx: ParserContext): ObjectExpression {
  // TODO add support for spread operator
  const { fragment, elements } = parse_sequence(ctx, ['{', '}'], ctx => {
    let key: Expression;
    // computed
    if (match_token(ctx, 'symbol', '[')) {
      consume_token(ctx);
      key = parse_expression(ctx, 1); // ensure we don't parse comma expressions
      ensure_token(ctx, 'symbol', ']');
    }
    // static
    else {
      const { value, fragment } = ensure_token(ctx, 'identifier');
      key = { type: 'json_expression', fragment, value };
    }
    ensure_token(ctx, 'symbol', ':');
    const value = parse_expression(ctx, 1); // ensure we don't parse comma expressions
    return { key, value };
  });

  return { type: 'object_expression', fragment, elements };
}

export function parse_array_literal(ctx: ParserContext): ArrayExpression {
  // TODO add support for spread operator
  const { fragment, elements } = parse_expression_sequence(ctx, ['[', ']'], 1);
  return { type: 'array_expression', fragment, elements };
}

export function parse_negation_expression(ctx: ParserContext, precedence: number): SimplePrefixExpression {
  const { fragment: start } = ensure_token(ctx, 'symbol', '-');
  const expression = parse_expression(ctx, precedence);

  return {
    type: 'negate_expression',
    fragment: join_fragments(start, expression.fragment),
    expression,
  };
}

export function parse_plus_expression(ctx: ParserContext, precedence: number): SimplePrefixExpression {
  const { fragment: start } = ensure_token(ctx, 'symbol', '+');
  const expression = parse_expression(ctx, precedence);

  return {
    type: 'plus_expression',
    fragment: join_fragments(start, expression.fragment),
    expression,
  };
}

export function parse_not_expression(ctx: ParserContext, precedence: number): SimplePrefixExpression {
  const { fragment: start } = ensure_token(ctx, 'identifier', 'not');
  const expression = parse_expression(ctx, precedence);
  const fragment = join_fragments(start, expression.fragment);
  return { type: 'not_expression', fragment, expression };
}

export function parse_typeof_expression(ctx: ParserContext, precedence: number): SimplePrefixExpression {
  const { fragment: start } = ensure_token(ctx, 'identifier', 'typeof');
  const expression = parse_expression(ctx, precedence);
  const fragment = join_fragments(start, expression.fragment);
  return { type: 'typeof_expression', fragment, expression };
}

export function parse_group_expression(ctx: ParserContext): GroupExpression {
  const { fragment: start } = ensure_token(ctx, 'symbol', '(');
  let expression;
  if (!match_token(ctx, 'symbol', ')')) {
    expression = parse_expression(ctx); // default precedence
  }
  const { fragment: end } = ensure_token(ctx, 'symbol', ')');
  return { type: 'group_expression', fragment: join_fragments(start, end), expression };
}

export function parse_json_value(ctx: ParserContext): JSONValue {
  const token = peek_token(ctx);

  if (!token) {
    unexpected_end_of_input(ctx.fragment.end, ctx.fragment.source);
  }

  const { type, value } = token;

  if (type === 'symbol') {
    if (value === '{') {
      return parse_json_object(ctx);
    }
    if (value === '[') {
      return parse_json_array(ctx);
    }
  }
  if (type === 'identifier') {
    consume_token(ctx);
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }
    if (value === 'null') {
      return null;
    }
  }
  if (type === 'number') {
    return Number(consume_token(ctx).value);
  }
  if (type === 'string') {
    return consume_token(ctx).value;
  }

  unexpected_token(value, token.fragment);
}

export function parse_json_object(ctx: ParserContext): JSONObject {
  return Object.fromEntries(parse_sequence(ctx, [ '{', '}' ], (ctx): [string, JSONValue] => {
    const key = match_token(ctx, 'string') ? consume_token(ctx).value : ensure_token(ctx, 'identifier').value;
    const value = parse_json_value(ctx);
    return [key, value];
  }).elements);
}

export function parse_json_array(ctx: ParserContext): JSONArray {
  return parse_sequence(ctx, [ '[', ']' ], ctx => parse_json_value(ctx)).elements;
}