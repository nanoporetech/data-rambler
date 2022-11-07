import { parse_expression } from "../expression";
import type { OutputStatement } from "../expression.type";
import { ensure_token } from "../parser_context";
import type { ParserContext } from "../parser_context.type";
import { end_statement } from "../statement";

export function parse_output_statement (ctx: ParserContext): OutputStatement {
	const { start } = ensure_token(ctx, 'identifier', 'out');
	const name = ensure_token(ctx, 'identifier').value;
  
  ensure_token(ctx, 'symbol', '=');

  const expression = parse_expression(ctx);
 	const end = end_statement(ctx);

	return {
		type: 'output_statement',
		name,
    expression,
		start,
		end,
	};
}