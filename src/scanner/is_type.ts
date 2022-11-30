import { peek_char } from './scan_context';
import type { ScanContext } from './scan_context.type';

const SYMBOLS = new Set([
  '!',
  '@',
  '#',
  '&',
  '*',
  '(',
  ')',
  '-',
  '+',
  '=',
  '{',
  '}',
  '[',
  ']',
  ':',
  '%',
  ';',
  '|',
  '<',
  '>',
  '~',
  '^',
  ',',
  '.',
  '?',
  '/'
]);

export function is_identifier(ctx: ScanContext, offset = 0): boolean {
  return /^[\p{L}_$]$/ui.test(peek_char(ctx, offset) ?? '');
}

export function is_number(ctx: ScanContext, offset = 0) : boolean {
  return /^[0-9]$/i.test(peek_char(ctx, offset) ?? '');
}

export function is_symbol(ctx: ScanContext, offset = 0): boolean {
  return SYMBOLS.has(peek_char(ctx, offset) ?? '');
}

export function is_string(ctx: ScanContext, offset = 0): boolean {
  return peek_char(ctx, offset) === '"';
}

export function is_single_string(ctx: ScanContext, offset = 0): boolean {
  return peek_char(ctx, offset) === '\'';
}

export function is_backtick_string(ctx: ScanContext, offset = 0): boolean {
  return peek_char(ctx, offset) === '`';
}

export function is_whitespace(ctx: ScanContext, offset = 0): boolean {
  return /^[\s]$/i.test(peek_char(ctx, offset) ?? '');
}