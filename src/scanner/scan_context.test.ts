import { consume_char, create_scanner_context, current_position, peek_char } from './scan_context';

describe('peek char', () => {
	it('does not increment index after character', () => {
		const ctx = create_scanner_context('a');
		peek_char(ctx);
		expect(ctx.index).toEqual(0);
	});
	it('does not increment column after character', () => {
		const ctx = create_scanner_context('a');
		peek_char(ctx);
		const { column } = current_position(ctx);
		expect(column).toEqual(1);
	});
	it('does not increment row on newline', () => {
		const ctx = create_scanner_context('\n');
		peek_char(ctx);
		const { row } = current_position(ctx);
		expect(row).toEqual(1);
	});
	it('does not reset column on newline', () => {
		const ctx = create_scanner_context('a\n');
		consume_char(ctx); // assumes that consume_char behaves correctly
		expect(ctx.column).toEqual(2);
		peek_char(ctx);
		expect(ctx.column).toEqual(2);
	});
	it('does emit the current char', () => {
		const ctx = create_scanner_context('a');
		const result = peek_char(ctx);
		expect(result).toEqual('a');
	});
	it('does allow lookahead', () => {
		const ctx = create_scanner_context('abcdefg');
		const result = peek_char(ctx, 2);
		expect(result).toEqual('c');
	});
	it('doesn\'t error at end of file', () => {
		const ctx = create_scanner_context('');
		const result = peek_char(ctx);
		expect(result).toBeUndefined();
	});
});

describe('consume char', () => {
	it('does increment index after character', () => {
		const ctx = create_scanner_context('a');
		consume_char(ctx);
		expect(ctx.index).toEqual(1);
	});
	it('does increment column after character', () => {
		const ctx = create_scanner_context('a');
		consume_char(ctx);
		const { column } = current_position(ctx);
		expect(column).toEqual(2);
	});
	it('does increment row on newline', () => {
		const ctx = create_scanner_context('\n');
		consume_char(ctx);
		const { row } = current_position(ctx);
		expect(row).toEqual(2);
	});
	it('does reset column on newline', () => {
		const ctx = create_scanner_context('\n');
		consume_char(ctx);
		const { column } = current_position(ctx);
		expect(column).toEqual(1);
	});
	it('does emit the current char', () => {
		const ctx = create_scanner_context('a');
		const result = consume_char(ctx);
		expect(result).toEqual('a');
	});
	it('does error at end of file', () => {
		const ctx = create_scanner_context('');
		expect(() => consume_char(ctx)).toThrow('SyntaxError: Unexpected end of input.');
	});
});