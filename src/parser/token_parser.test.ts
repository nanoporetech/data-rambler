import { read_token_pattern } from './token_pattern';

describe('read pattern', () => {
	it('works with only a token type', () => {
		expect(read_token_pattern('identifier')).toEqual({ type: 'identifier' });
		expect(read_token_pattern('symbol')).toEqual({ type: 'symbol' });
		expect(read_token_pattern('number')).toEqual({ type: 'number' });
		expect(read_token_pattern('string')).toEqual({ type: 'string' });
	});
	it('correctly splits a type and value', () => {
		expect(read_token_pattern('identifier:')).toEqual({ type: 'identifier', value: '' });
		expect(read_token_pattern('identifier:alpha')).toEqual({ type: 'identifier', value: 'alpha' });
		expect(read_token_pattern('symbol::')).toEqual({ type: 'symbol', value: ':' });
	});
});