export function unexpected_end_of_input(): never {
	syntax_error('Unexpected end of input.');
}

export function unexpected_token(token: string): never {
	syntax_error(`Invalid or unexpected token "${token}".`);
}

export function unsupported_escape_sequence(token: string): never {
	syntax_error(`Unsupported escape sequence "\\${token}".`);
}

export function syntax_error(msg: string): never {
	throw new Error(`SyntaxError: ${msg}`);
}