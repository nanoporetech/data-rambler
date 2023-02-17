import { unexpected_end_of_input } from './error';

import type { Position } from './Position.type';
import type { ScanContext } from './scan_context.type';

export function peek_char(ctx: ScanContext, offset = 0): string | undefined {
  return ctx.source[ctx.index + offset];
}

export function consume_char(ctx: ScanContext): string {
  const ch = ctx.source[ctx.index];
  if (ch === undefined || characters_remaining(ctx) === false) {
    unexpected_end_of_input(current_position(ctx));
  }
  ctx.index += 1;
  if (ch === '\n') {
    ctx.column = 1;
    ctx.row += 1;
  }
  else {
    ctx.column += 1;
  }
  return ch;
}

export function characters_remaining(ctx: ScanContext): boolean {
  return ctx.index < ctx.length;
}

export function current_position(ctx: ScanContext): Position {
  const { column, row } = ctx;
  return {
    column,
    row
  };
}

export function create_scanner_context(str: string): ScanContext {
  const source = Array.from(str);
  return {
    source,
    index: 0,
    length: source.length,
    column: 1,
    row: 1, 
  };
}