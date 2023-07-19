import { unexpected_end_of_input, unexpected_token, unsupported_escape_sequence } from './error';
import { is_identifier, is_number, is_single_string, is_string, is_symbol, is_whitespace } from './is_type';
import { create_scanner_context, characters_remaining, peek_char, consume_char } from './scan_context';
import { buffer_append, buffer_consume, buffer_start } from './text_buffer';

import type { ScanContext } from './scan_context.type';
import type { TextBuffer } from './text_buffer.type';
import type { Token } from './token.type';
import type { Fragment } from './Position.type';

export function scan(source: string): Token[] {
  const ctx = create_scanner_context(source);
  const buffer: TextBuffer = { start: 0, length: 0 };
  const tokens: Token[] = [];
  while (characters_remaining(ctx)) {
    const token = scan_token(ctx, buffer);
    if (token) {
      tokens.push(token);
    }
  }
  return tokens;
}

export function scan_token(ctx: ScanContext, buffer: TextBuffer): Token | void {
  if (is_identifier(ctx)) {
    return scan_identifier(ctx, buffer);
  }
  if (is_number(ctx)) {
    return scan_number(ctx, buffer);
  }
  if (is_string(ctx)) {
    return scan_string(ctx, buffer, '"');
  }
  if (is_single_string(ctx)) {
    return scan_string(ctx, buffer, '\'');
  }
  if (is_symbol(ctx)) {
    return scan_symbol(ctx);
  }
  if (is_whitespace(ctx)) {
    return scan_whitespace(ctx);
  }

  if (characters_remaining(ctx)) {
    unexpected_token(peek_char(ctx)!, { start: ctx.index, end: ctx.index + 1, source: ctx.source });
  } else {
    unexpected_end_of_input(ctx.index, ctx.source);
  }
}

export function scan_identifier(ctx: ScanContext, buffer: TextBuffer): Token {
  const start = ctx.index;
  buffer_start(buffer, ctx);
  while (characters_remaining(ctx)) {
    buffer_append(buffer, ctx);
    if (is_identifier(ctx) === false && is_number(ctx) === false) {
      break;
    }
  }
  const end = ctx.index;
  const fragment = { start, end, source: ctx.source };
  const value = buffer_consume(buffer, ctx);
  return { fragment, row: ctx.row, value, type: 'identifier' };
}

export function scan_number(ctx: ScanContext, buffer: TextBuffer): Token {
  const start = ctx.index;
  buffer_start(buffer, ctx);
  while (characters_remaining(ctx)) {
    buffer_append(buffer, ctx);
    if (is_number(ctx) === false) {
      break;
    }
  }
  if (peek_char(ctx) === '.' && is_number(ctx, 1)) {
    buffer_append(buffer, ctx);
    while (characters_remaining(ctx)) {
      buffer_append(buffer, ctx);
      if (is_number(ctx) === false) {
        break;
      }
    }
  }
  const end = ctx.index;
  const fragment = { start, end, source: ctx.source };
  const value = buffer_consume(buffer, ctx);
  return { fragment, row: ctx.row, value, type: 'number' };
}

export function scan_string(ctx: ScanContext, buffer: TextBuffer, end_ch: string): Token {
  const start = ctx.index;
  consume_char(ctx); // consume starting quote mark
  buffer_start(buffer, ctx);
  let includes_escapes = false;
  while (characters_remaining(ctx)) {
    const ch = peek_char(ctx);
    if (ch === end_ch) {
      consume_char(ctx);
      break;
    }
    buffer_append(buffer, ctx);

    // detect an escape, and consume the next char
    // this is primarily for \" sequences so that
    // we don't end the string. actual validation and
    // transform of the escape needs doing later.
    //
    // https://mathiasbynens.be/notes/javascript-escapes
    if (ch === '\\') {
      const ch = peek_char(ctx);
      buffer_append(buffer, ctx);
      // unicode escape sequences are 6 characters e.g. \u0000
      if (ch === 'u') {
        // TODO show better a better error for this
        buffer_append(buffer, ctx);
        buffer_append(buffer, ctx);
        buffer_append(buffer, ctx);
        buffer_append(buffer, ctx);
      }
      // hex escape sequences are 4 characters e.g. \x00
      else if (ch === 'x') {
        // TODO show better a better error for this
        buffer_append(buffer, ctx);
        buffer_append(buffer, ctx);
      }
      includes_escapes = true;
    }
  }
  const end = ctx.index;
  const fragment = { start, end, source: ctx.source };
  let value = buffer_consume(buffer, ctx);
  if (includes_escapes) {
    value = transform_escape_sequences(value, fragment);
  }
  return { fragment, row: ctx.row, value, type: 'string' };
}

const special_chars: Record<string, string> = {
  '\\': '\\',
  b: '\b',
  f: '\f',
  r: '\r',
  t: '\t',
  n: '\n',
  v: '\v',
  '0': '\0'
};

export function transform_escape_sequences (source: string, fragment: Fragment): string {
  const output = [];
  const characters = [...source];
  for (let i = 0; i < characters.length; i += 1) {
    const ch = characters[i];
    if (ch !== '\\') {
      output.push(ch);
      continue;
    }
    // assumes that the input string is well formed by having
    // AT LEAST 1 more character
    i += 1;
    const escaped_ch = characters[i];
    if (escaped_ch && escaped_ch in special_chars) {
      output.push(special_chars[escaped_ch]);
    } else if (escaped_ch === 'u') {
      // requires 4 more chars, or is invalid
      const code = characters.slice(i + 1, i + 5).join('');
      if (isNaN(parseInt(code, 16))) {
        const sub_fragment = {
          start: fragment.start + i - 1,
          end: fragment.start + i + 5,
          source: fragment.source
        };
        unsupported_escape_sequence('u' + code, sub_fragment);
      }
      output.push(String.fromCharCode(parseInt(code, 16)));
      i += 4;
    } else if (escaped_ch === 'x') {
      // requires 2 more chars, or is invalid
      const code = characters.slice(i + 1, i + 3).join('');
      if (isNaN(parseInt(code, 16))) {
        const sub_fragment = {
          start: fragment.start + i - 1,
          end: fragment.start + i + 3, 
          source: fragment.source
        };
        unsupported_escape_sequence('x' + code, sub_fragment);
      }
      output.push(String.fromCharCode(parseInt(code, 16)));
      i += 2;
    } else {
      // TODO maybe error?
      output.push(escaped_ch);
    }
  }
  return output.join('');
}

export function scan_line_comment(ctx: ScanContext): void {
  consume_char(ctx);
  consume_char(ctx);
  while (characters_remaining(ctx)) {
    if (consume_char(ctx) === '\n') {
      break;
    }
  }
}

export function scan_comment(ctx: ScanContext): void {
  consume_char(ctx);
  consume_char(ctx);
  while (characters_remaining(ctx)) {
    if (consume_char(ctx) === '*' && peek_char(ctx) === '/') {
      consume_char(ctx);
      break;
    }
  }
  return;
}

export function scan_symbol(ctx: ScanContext): Token | void {
  // TODO add support for Regular Expression Literals

  if (peek_char(ctx) === '/' && peek_char(ctx, 1) === '*') {
    return scan_comment(ctx);
  }
  if (peek_char(ctx) === '/' && peek_char(ctx, 1) === '/') {
    return scan_line_comment(ctx);
  }
  const start = ctx.index;
  const value = consume_char(ctx);
  const end = ctx.index;
  const fragment = { start, end, source: ctx.source };
  return { fragment, row: ctx.row, value, type: 'symbol' };
}

export function scan_whitespace(ctx: ScanContext): void {
  while (characters_remaining(ctx)) {
    consume_char(ctx);
    if (is_whitespace(ctx) === false) {
      break;
    }
  }
  return;
}