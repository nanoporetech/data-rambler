import { create_scanner_context } from './scan_context';
import { scan, scan_comment, scan_identifier, scan_line_comment, scan_number, scan_string, scan_symbol, scan_token } from './scanner';

import type { TextBuffer } from './text_buffer.type';

describe('scan identifier', () => {
  it('updates index', () => {
    const ctx = create_scanner_context('hello');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(ctx).toEqual({
      source: [...'hello'],
      index: 0,
      length: 5,
      column: 1,
      row: 1
    });
    scan_identifier(ctx, buffer);
    expect(ctx).toEqual({
      source: [...'hello'],
      index: 5,
      length: 5,
      column: 6,
      row: 1
    });
  });
  it('emits identifier token', () => {
    const ctx = create_scanner_context('h3ll0');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(scan_identifier(ctx, buffer)).toEqual({
      type: 'identifier',
      start: { column: 1, row: 1},
      end: { column: 6, row: 1 },
      value: 'h3ll0'
    });
  });
  it('can have numbers after first character', () => {
    const ctx = create_scanner_context('h3ll0');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(scan_identifier(ctx, buffer)).toEqual({
      type: 'identifier',
      start: { column: 1, row: 1},
      end: { column: 6, row: 1 },
      value: 'h3ll0'
    });
  });
});

describe('scan number', () => {
  it('updates index', () => {
    const ctx = create_scanner_context('314');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(ctx).toEqual({
      source: [...'314'],
      index: 0,
      length: 3,
      column: 1,
      row: 1
    });
    scan_number(ctx, buffer);
    expect(ctx).toEqual({
      source: [...'314'],
      index: 3,
      length: 3,
      column: 4,
      row: 1
    });
  });
  it('emits number token', () => {
    const ctx = create_scanner_context('314');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(scan_number(ctx, buffer)).toEqual({
      type: 'number',
      start: { column: 1, row: 1},
      end: { column: 4, row: 1 },
      value: '314'
    });
  });
});

describe('scan string', () => {
  it('updates index', () => {
    const ctx = create_scanner_context('"314"');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(ctx).toEqual({
      source: [...'"314"'],
      index: 0,
      length: 5,
      column: 1,
      row: 1
    });
    scan_string(ctx, buffer, '"');
    expect(ctx).toEqual({
      source: [...'"314"'],
      index: 5,
      length: 5,
      column: 6,
      row: 1
    });
  });
  it('emits string token', () => {
    const ctx = create_scanner_context('"314"');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(scan_string(ctx, buffer, '"')).toEqual({
      type: 'string',
      start: { column: 1, row: 1},
      end: { column: 6, row: 1 },
      value: '314'
    });
  });
  it('parses empty string', () => {
    const ctx = create_scanner_context('""');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(scan_string(ctx, buffer, '"')).toEqual({
      type: 'string',
      start: { column: 1, row: 1},
      end: { column: 3, row: 1 },
      value: ''
    });
  });
  it('correctly escapes', () => {
    const ctx = create_scanner_context(String.raw`"hello \u2665\xA9\n\\\b\f\r\t\v\0\""`);
    const buffer: TextBuffer = { start: 0, length: 0 };
    const result = scan_string(ctx, buffer, '"');
    expect(result).toEqual({
      type: 'string',
      start: { column: 1, row: 1},
      end: { column: 37, row: 1 },
      value: 'hello ♥©\n\\\b\f\r\t\v\0"'
    });
  });
  it('throws for invalid escape', () => {
    expect(()=> scan('"\\uzzzz"')).toThrow('Unsupported escape sequence "\\uzzzz".');
    expect(()=> scan('"\\xzz"')).toThrow('Unsupported escape sequence "\\xzz".');
  });
});

describe('scan line comment', () => {
  it('updates index', () => {
    const ctx = create_scanner_context('// test');
    scan_line_comment(ctx);
    expect(ctx).toEqual({
      source: [...'// test'],
      index: 7,
      length: 7,
      column: 8,
      row: 1
    });
  });
  it('terminates on newline', () => {
    const ctx = create_scanner_context('// test\nalpha');
    scan_line_comment(ctx);
    expect(ctx).toEqual({
      source: [...'// test\nalpha'],
      index: 8,
      length: 13,
      column: 1,
      row: 2
    });
  });
});

describe('scan comment', () => {
  it('updates index', () => {
    const ctx = create_scanner_context('/**/');
    scan_comment(ctx);
    expect(ctx).toEqual({
      source: [...'/**/'],
      index: 4,
      length: 4,
      column: 5,
      row: 1
    });
  });
  it('can consume multiple lines', () => {
    const ctx = create_scanner_context('/*\n\n\n*/');
    scan_comment(ctx);
    expect(ctx).toEqual({
      source: [...'/*\n\n\n*/'],
      index: 7,
      length: 7,
      column: 3,
      row: 4
    });
  });
});

describe('scan symbol', () => {
  describe('identifies line comments', () => {
    it('updates index', () => {
      const ctx = create_scanner_context('// test');
      scan_symbol(ctx);
      expect(ctx).toEqual({
        source: [...'// test'],
        index: 7,
        length: 7,
        column: 8,
        row: 1
      });
    });
    it('terminates on newline', () => {
      const ctx = create_scanner_context('// test\nalpha');
      scan_symbol(ctx);
      expect(ctx).toEqual({
        source: [...'// test\nalpha'],
        index: 8,
        length: 13,
        column: 1,
        row: 2
      });
    });
  });
  describe('identifies comments', () => {
    it('updates index', () => {
      const ctx = create_scanner_context('/**/');
      scan_symbol(ctx);
      expect(ctx).toEqual({
        source: [...'/**/'],
        index: 4,
        length: 4,
        column: 5,
        row: 1
      });
    });
    it('can consume multiple lines', () => {
      const ctx = create_scanner_context('/*\n\n\n*/');
      scan_symbol(ctx);
      expect(ctx).toEqual({
        source: [...'/*\n\n\n*/'],
        index: 7,
        length: 7,
        column: 3,
        row: 4
      });
    });
  });
  describe('identifies divide symbol', () => {
    it('when it looks like a comment', () => {
      const ctx = create_scanner_context('/ *');
      const token = scan_symbol(ctx);
      expect(token ? token.value : null).toEqual('/');
      expect(ctx).toEqual({
        source: [...'/ *'],
        index: 1,
        length: 3,
        column: 2,
        row: 1
      });
    });
    it('when it looks like a line comment', () => {
      const ctx = create_scanner_context('/ /');
      const token = scan_symbol(ctx);
      expect(token ? token.value : null).toEqual('/');
      expect(ctx).toEqual({
        source: [...'/ /'],
        index: 1,
        length: 3,
        column: 2,
        row: 1
      });
    });
  });
});

describe('scan', () => {
  it('identifier', () => {
    expect(scan('const foo')).toEqual([
      {
        type: 'identifier',
        value: 'const',
        start: {
          row: 1,
          column: 1,
        },
        end: {
          row: 1,
          column: 6,
        },
      },
      {
        type: 'identifier',
        value: 'foo',
        start: {
          row: 1,
          column: 7,
        },
        end: {
          row: 1,
          column: 10,
        },
      }
    ]);
  });
  it('number', () => {
    expect(scan('1')).toEqual([
      {
        type: 'number',
        value: '1',
        start: {
          row: 1,
          column: 1,
        },
        end: {
          row: 1,
          column: 2,
        },
      }
    ]);
    expect(scan('0.1')).toEqual([
      {
        type: 'number',
        value: '0.1',
        start: {
          row: 1,
          column: 1,
        },
        end: {
          row: 1,
          column: 4,
        },
      }
    ]);
    expect(scan('0.')).toEqual([
      {
        type: 'number',
        value: '0',
        start: {
          row: 1,
          column: 1,
        },
        end: {
          row: 1,
          column: 2,
        },
      },
      {
        type: 'symbol',
        value: '.',
        start: {
          row: 1,
          column: 2,
        },
        end: {
          row: 1,
          column: 3,
        },
      }
    ]);
    expect(scan('0.11a')).toEqual([
      {
        type: 'number',
        value: '0.11',
        start: {
          row: 1,
          column: 1,
        },
        end: {
          row: 1,
          column: 5,
        },
      },
      {
        type: 'identifier',
        value: 'a',
        start: {
          row: 1,
          column: 5,
        },
        end: {
          row: 1,
          column: 6,
        },
      }
    ]);
  });
  it('string', () => {
    expect(scan('"hello"')).toEqual([
      {
        type: 'string',
        value: 'hello',
        start: {
          row: 1,
          column: 1,
        },
        end: {
          row: 1,
          column: 8,
        },
      }
    ]);
    expect(scan('"hello" + "world"')).toEqual([
      {
        type: 'string',
        value: 'hello',
        start: {
          row: 1,
          column: 1,
        },
        end: {
          row: 1,
          column: 8,
        },
      },
      {
        type: 'symbol',
        value: '+',
        start: {
          row: 1,
          column: 9,
        },
        end: {
          row: 1,
          column: 10,
        },
      },
      {
        type: 'string',
        value: 'world',
        start: {
          row: 1,
          column: 11,
        },
        end: {
          row: 1,
          column: 18,
        },
      }
    ]);
  });
  it('whitespace', () => {
    expect(scan('  \t 	 		 	 	\n')).toEqual([]);
  });
  it('throws with invalid char', () => {
    expect(() => scan('\0')).toThrow('Invalid or unexpected token "\0".');
  });
  it('scan_token protected from unreachable EOF', () => {
    const ctx = create_scanner_context('');
    const buffer: TextBuffer = { start: 0, length: 0 };
    expect(() => scan_token(ctx, buffer)).toThrow('Invalid or unexpected token "EOF".');
  });
});