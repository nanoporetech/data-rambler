import { split_symbol_token_pattern, add_prefix_parselet, add_infix_parselet, get_infix_parselet } from './parselets';
import { consume_token, create_parser_context } from './parser_context';

describe('parselets', () => {
	it('split symbol pattern with no value', () => {
		expect(split_symbol_token_pattern()).toEqual(['symbol']);
	});
	it('duplicate prefix parselet', () => {
		const pattern = 'symbol:_'; // impossible pattern, prevents conflict
		const parselet = () => { throw new Error('NOT IMPLEMENTED'); };

		add_prefix_parselet(pattern, 0, parselet);
		expect(() => add_prefix_parselet(pattern, 0, parselet)).toThrow(`A prefix parselet with the pattern ${pattern} has already been registered`);
	});
	it('duplicate infix parselet', () => {
		const pattern = 'symbol:_'; // impossible pattern, prevents conflict
		const parselet = () => { throw new Error('NOT IMPLEMENTED'); };

		add_infix_parselet(pattern, 0, parselet);
		expect(() => add_infix_parselet(pattern, 0, parselet)).toThrow(`A parselet already exists for pattern ${pattern}`);
	});
	it('no matching infix parselet', () => {
		// create a very specific dummy 2 token infix parselet
		{
			const pattern = 'symbol:$$'; // impossible pattern, prevents conflict
			const parselet = () => { throw new Error('NOT IMPLEMENTED'); };
			add_infix_parselet(pattern, 0, parselet);
		}
		// create an input that matches PART of the dummy parselet
		// but doesn't have any partial matches
		const pos = { column: 1, row: 1 };
		const ctx = create_parser_context([
			{
				type: 'symbol',
				value: '$',
				start: pos,
				end: pos,
			},
			{
				type: 'symbol',
				value: '+',
				start: pos,
				end: pos,
			},
		]);
		
		const token = consume_token(ctx);
		expect(() => get_infix_parselet(token, ctx)).toThrow('Invalid or unexpected token "$".');
	});
});