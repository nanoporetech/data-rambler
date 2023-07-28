import type { Fragment } from './Position.type';

export function unexpected_end_of_input(index: number, source: string[]): never {
  const fragment = { start: index, end: index, source };
  syntax_error('Unexpected end of input.', fragment);
}

export function unexpected_token(token: string, fragment: Fragment): never {
  syntax_error(`Invalid or unexpected token "${token}".`, fragment);
}

export function unsupported_escape_sequence(token: string, fragment: Fragment): never {
  syntax_error(`Unsupported escape sequence "\\${token}".`, fragment);
}

export function syntax_error(msg: string, fragment: Fragment): never {
  named_error('SyntaxError', msg, fragment);
}

export function type_error(msg: string, fragment: Fragment): never {
  named_error('TypeError', msg, fragment);
}

export function reference_error(msg: string, fragment: Fragment): never {
  named_error('ReferenceError', msg, fragment);
}

export function compiler_error(msg: string, fragment?: Fragment): never {
  named_error('CompilerError', msg, fragment);
}

export function named_error(name: string, msg: string, fragment?: Fragment): never {
  if (!fragment) {
    throw new Error(`${name}: ${msg}`);
  }
  throw new Error(`${name}: ${msg}\n${highlight_fragment(fragment)}`);
}

export function unknown_attribute(name: string, fragment: Fragment): never {
  syntax_error(`Unknown attribute ${name}.`, fragment);
}

const NEWLINE = '\n';

export function highlight_fragment (fragment: Fragment): string {
  let row = 0;
  let line_start = 0;
  let index = 0;

  while (index < fragment.start) {
    line_start = index;
    row += 1;
    index = fragment.source.indexOf(NEWLINE, index);
  }

  const lines = [];
  index = line_start;

  while (index < fragment.end) {
    const start = index;
    index = fragment.source.indexOf(NEWLINE, index);
    lines.push({ start, end: index });
  }

  const line_label_width = Math.log10(row + lines.length) + 1;
  
  return lines.map(({ start, end }, row_offset) => {
    const line_number = (row + row_offset).toString();

    const line = line_number.padStart(line_label_width) + ' | ' + fragment.source.slice(start, end).join('');

    const highlight_start = Math.max(start, fragment.start) - start;
    const highlight_end = Math.min(end, fragment.end) - start;
    const underline = ' '.repeat(line_label_width) + ' | ' + ' '.repeat(highlight_start) + '^'.repeat(highlight_end - highlight_start);

    return line + NEWLINE + underline;
  }).join(NEWLINE);
}