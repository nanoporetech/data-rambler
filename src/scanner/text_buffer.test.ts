import { create_scanner_context } from './scan_context';
import { buffer_append, buffer_consume, buffer_start } from './text_buffer';

describe('buffer append', () => {
	it('consumes a character', () => {
		const ctx = create_scanner_context('hello');
		buffer_append({ start: 0, length: 0 }, ctx);
		expect(ctx.index).toEqual(1);
	});
	it('appends characters', () => {
		const ctx = create_scanner_context('hello');
		const buffer = { start: 0, length: 0 };
		buffer_start(buffer, ctx);
		buffer_append(buffer, ctx);
		expect(buffer).toEqual({ start: 0, length: 1 });
		buffer_append(buffer, ctx);
		expect(buffer).toEqual({ start: 0, length: 2 });
	});
});

describe('buffer consume', () => {
	it('clears the buffer', () => {
		const ctx = create_scanner_context('hello');
		const buffer = { start: 0, length: 5};
		buffer_consume(buffer, ctx);
		expect(buffer.length).toEqual(0);
	});
	it('returns the contents of the buffer', () => {
		const ctx = create_scanner_context('hello');
		const buffer = { start: 0, length: 5};
		expect(buffer_consume(buffer, ctx)).toEqual('hello');
	});
});