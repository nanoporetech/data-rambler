import { consume_token, ensure_token, match_token, peek_token, previous_token } from '../parser_context';

import type { ParserContext } from '../parser_context.type';
import type { JSONArray, JSONObject, JSONValue } from '../../JSON.type'; 
import { parse_sequence } from '../sequence';
import { unexpected_end_of_input, unexpected_token } from '../../scanner/error';
import { parse_expression } from '../expression';
import type { Sequence } from '../sequence.type';
import type { ArrayExpression, Expression, FieldExpression, FunctionExpression, GroupExpression, IdentifierExpression, JSONExpression, ObjectExpression, SimplePrefixExpression, SymbolExpression } from '../expression.type';

export function parse_expression_sequence (ctx: ParserContext, delimiter: [string, string], precedence = 0): Sequence<Expression> {
  return parse_sequence(ctx, delimiter, ctx => parse_expression(ctx, precedence));
}

export function parse_json_expression(ctx: ParserContext): JSONExpression {
  const token = peek_token(ctx);

  if (!token) {
    unexpected_end_of_input();
  }

  const { start } = token;
  const value = parse_json_value(ctx);
  const { end } = previous_token(ctx);

  return {
    type: 'json_expression',
    start,
    end,
    value
  };
}

export function parse_number_literal(ctx: ParserContext): JSONExpression {
  const { start, value, end } = consume_token(ctx);
  return {
    type: 'json_expression',
    start,
    end,
    value: Number(value),
  };
}

export function parse_string_literal(ctx: ParserContext): JSONExpression {
  const { start, value, end } = consume_token(ctx);
  return {
    type: 'json_expression',
    start,
    end,
    value,
  };
}

export function parse_boolean_literal(ctx: ParserContext): JSONExpression {
  const { start, value, end } = consume_token(ctx);
  return {
    type: 'json_expression',
    start,
    end,
    value: value === 'true',
  };
}

export function parse_null_literal(ctx: ParserContext): JSONExpression {
  const { start, end } = consume_token(ctx);
  return {
    type: 'json_expression',
    start,
    end,
    value: null,
  };
}

export function parse_object_literal(ctx: ParserContext): ObjectExpression {
  const { start, end, elements } = parse_sequence(ctx, ['{', '}'], ctx => {
    const key = parse_expression(ctx, 1); // ensure we don't parse comma expressions
    ensure_token(ctx, 'symbol', ':');
    const value = parse_expression(ctx, 1); // ensure we don't parse comma expressions
    return { key, value };
  });

  return {
    type: 'object_expression',
    start,
    end,
    elements,
  };
}

export function parse_array_literal(ctx: ParserContext): ArrayExpression {
  const { start, end, elements } = parse_expression_sequence(ctx, ['[', ']'], 1);
  return {
    type: 'array_expression',
    start,
    end,
    elements,
  };
}

export function parse_field_expression(ctx: ParserContext): FieldExpression | IdentifierExpression {
  const { start, value, end } = consume_token(ctx);

  const type = value.startsWith('$') ? 'identifier_expression' : 'field_expression';

  return {
    type,
    start,
    end,
    value: type === 'identifier_expression' ? value.slice(1) : value,
  };
}

export function parse_function_expression(ctx: ParserContext): FunctionExpression {
  const { start } = ensure_token(ctx, 'identifier', 'fn');
  const { elements: parameters } = parse_sequence(ctx, ['(', ')'], ctx => {
    const { value } = ensure_token(ctx, 'identifier');
    if (!value.startsWith('$')) {
      throw new Error(`Parameter ${value} of function definition must be a variable name (start with $)`);
    }
    return value.slice(1);
  });
  ensure_token(ctx, 'symbol', '{');
  const body = parse_expression(ctx); // default precedence
  const { end } = ensure_token(ctx, 'symbol', '}');

  return {
    type: 'function_expression',
    start, 
    end,
    parameters,
    body
  };
}

export function parse_negation_expression(ctx: ParserContext, precedence: number): SimplePrefixExpression {
  const { start } = ensure_token(ctx, 'symbol', '-');
  const expression = parse_expression(ctx, precedence);
  const { end } = expression;

  return {
    type: 'negate_expression',
    start,
    end,
    expression,
  };
}

export function parse_not_expression(ctx: ParserContext, precedence: number): SimplePrefixExpression {
  const { start } = ensure_token(ctx, 'identifier', 'not');
  const expression = parse_expression(ctx, precedence);
  const { end } = expression;

  return {
    type: 'not_expression',
    start,
    end,
    expression,
  };
}

export function parse_wildcard_expression(ctx: ParserContext): SymbolExpression | SymbolExpression {
  const { start, end } = ensure_token(ctx, 'symbol', '*');

  if (match_token(ctx, 'symbol', '*')) {
    const { end } = consume_token(ctx);
    return {
      type: 'descendant_expression',
      start,
      end,
    }; 
  }
  return {
    type: 'wildcard_expression',
    start,
    end,
  };
}

export function parse_parent_expression(ctx: ParserContext): SymbolExpression {
  const { start, end } = ensure_token(ctx, 'symbol', '%');

  return {
    type: 'parent_expression',
    start,
    end,
  };
}

export function parse_typeof_expression(ctx: ParserContext, precedence: number): SimplePrefixExpression {
  const { start } = ensure_token(ctx, 'identifier', 'typeof');
  const expression = parse_expression(ctx, precedence);
  const { end } = expression;

  return {
    type: 'typeof_expression',
    start,
    end,
    expression,
  };
}

export function parse_group_expression(ctx: ParserContext): GroupExpression {
  const { start } = ensure_token(ctx, 'symbol', '(');
  let expression;
  if (!match_token(ctx, 'symbol', ')')) {
    expression = parse_expression(ctx); // default precedence
  }
  const { end } = ensure_token(ctx, 'symbol', ')');
  return {
    type: 'group_expression',
    start,
    end,
    expression,
  };
}

export function parse_json_value(ctx: ParserContext): JSONValue {
  const token = peek_token(ctx);

  if (!token) {
    unexpected_end_of_input();
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

  unexpected_token(value);
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