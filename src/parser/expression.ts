import { unexpected_end_of_input, unexpected_token } from '../scanner/error';
import type { Expression } from './expression.type';
import { parse_add_expression, parse_assignment_expression, parse_call_expression, parse_chain_expression, parse_coalescing_expression, parse_comma_expression, parse_concat_expression, parse_conditional_expression, parse_divide_expression, parse_equals_expression, parse_exponentiation_expression, parse_greater_than_expression, parse_greater_than_or_equals_expression, parse_less_than_expression, parse_less_than_or_equals_expression, parse_logical_and_expression, parse_logical_in_expression, parse_logical_or_expression, parse_multiply_expression, parse_not_equals_expression, parse_path_expression, parse_range_expression, parse_remainder_expression, parse_subtract_expression } from './expressions/infix';
import { parse_array_literal, parse_boolean_literal, parse_field_expression, parse_function_expression, parse_group_expression, parse_negation_expression, parse_not_expression, parse_null_literal, parse_number_literal, parse_object_literal, parse_parent_expression, parse_string_literal, parse_typeof_expression, parse_wildcard_expression } from './expressions/prefix';
import { add_infix_parselet, add_prefix_parselet, get_infix_parselet, get_prefix_parselet } from './parselets';
import { peek_token, tokens_remaining } from './parser_context';

import type { ParserContext } from './parser_context.type';

add_infix_parselet ('symbol:,',           1, parse_comma_expression);

add_infix_parselet ('symbol:?',           2, parse_conditional_expression);
add_infix_parselet ('symbol::=',           2, parse_assignment_expression);

add_infix_parselet ('symbol:??',          3, parse_coalescing_expression);
add_infix_parselet ('identifier:or',      3, parse_logical_or_expression);

add_infix_parselet ('identifier:and',     4, parse_logical_and_expression);

add_infix_parselet ('symbol:=',           5, parse_equals_expression);
add_infix_parselet ('symbol:!=',          5, parse_not_equals_expression);

add_infix_parselet ('identifier:in',      6, parse_logical_in_expression);
add_infix_parselet ('symbol:<',           6, parse_less_than_expression);
add_infix_parselet ('symbol:>',           6, parse_greater_than_expression);
add_infix_parselet ('symbol:<=',          6, parse_less_than_or_equals_expression);
add_infix_parselet ('symbol:>=',          6, parse_greater_than_or_equals_expression);
add_infix_parselet ('symbol:..',          6, parse_range_expression);

add_infix_parselet ('symbol:+',           7, parse_add_expression);
add_infix_parselet ('symbol:-',           7, parse_subtract_expression);
add_infix_parselet ('symbol:&',           7, parse_concat_expression);

add_infix_parselet ('symbol:*',           8, parse_multiply_expression);
add_infix_parselet ('symbol:/',           8, parse_divide_expression);
add_infix_parselet ('symbol:%',           8, parse_remainder_expression);

add_infix_parselet ('symbol:**',          9, parse_exponentiation_expression);

add_prefix_parselet('identifier:not',     10, parse_not_expression);
add_prefix_parselet('symbol:-',           10, parse_negation_expression);
add_prefix_parselet('identifier:typeof',  10, parse_typeof_expression);
add_prefix_parselet('symbol:{',           10, parse_object_literal);
add_prefix_parselet('symbol:[',           10, parse_array_literal);

add_infix_parselet ('symbol:.',           11, parse_path_expression);
add_infix_parselet ('symbol:[',           11, parse_path_expression);
add_infix_parselet ('symbol:^',           11, parse_path_expression);
add_infix_parselet ('symbol:{',           11, parse_path_expression);
add_infix_parselet ('symbol:#',           11, parse_path_expression);

add_infix_parselet ('symbol:~>',		  12, parse_chain_expression);

add_infix_parselet ('symbol:(',           13, parse_call_expression);


add_prefix_parselet('symbol:*', 		  14, parse_wildcard_expression);
add_prefix_parselet('symbol:%', 		  14, parse_parent_expression);
add_prefix_parselet('symbol:(',           14, parse_group_expression);
add_prefix_parselet('number',             14, parse_number_literal);
add_prefix_parselet('string',             14, parse_string_literal);
add_prefix_parselet('identifier:true',    14, parse_boolean_literal);
add_prefix_parselet('identifier:false',   14, parse_boolean_literal);
add_prefix_parselet('identifier:null',    14, parse_null_literal);
add_prefix_parselet('identifier',         14, parse_field_expression);
add_prefix_parselet('identifier:fn',      14, parse_function_expression); 

export function parse_expression(ctx: ParserContext, precedence = 0): Expression {
  let left = parse_prefix_expression(ctx);

  while (tokens_remaining(ctx)) {
    const next = parse_infix_expression(ctx, left, precedence);
    if (next) {
      left = next;
    }
    else {
      break;
    }
  }

  return left;
}

export function parse_prefix_expression(ctx: ParserContext): Expression {
  const token = peek_token(ctx);
  if (!token) {
    unexpected_end_of_input();
  }
  const parselet_info = get_prefix_parselet(token);
  if (!parselet_info) {
    unexpected_token(token.value);
  }
  const { precedence, parselet } = parselet_info;

  return parselet(ctx, precedence);
}

export function parse_infix_expression(ctx: ParserContext, left: Expression, parent_precedence: number): Expression | null {
  const token = peek_token(ctx);
  if (!token) {
    // unreachable - this function is _only_ called when there are remaining tokens
    // as such peek_token will always return a value here
    return null;
  }
  const parselet_info = get_infix_parselet(token, ctx);
  if (!parselet_info) {
    return null;
  }
	
  const { precedence, parselet } = parselet_info;
  if (parent_precedence < precedence) {
    return parselet(ctx, left, precedence);
  }
  return null;
}