import type { Position } from './Position.type';

export function unexpected_end_of_input(pos: Position): never {
  syntax_error('Unexpected end of input.', pos);
}

export function unexpected_token(token: string, pos: Position): never {
  syntax_error(`Invalid or unexpected token "${token}".`, pos);
}

export function unsupported_escape_sequence(token: string, pos: Position): never {
  syntax_error(`Unsupported escape sequence "\\${token}".`, pos);
}

export function syntax_error(msg: string, pos: Position): never {
  throw new Error(`SyntaxError: ${msg} @ line ${pos.row}`);
}

export function unknown_attribute(name: string, pos: Position): never {
  syntax_error(`Unknown attribute ${name}`, pos);
}