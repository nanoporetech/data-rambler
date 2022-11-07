import { create_scanner_context} from './scan_context';
import { is_identifier, is_number, is_string, is_symbol, is_whitespace } from './is_type';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const IDENTIFIER_CHARS = `${ALPHABET}_${ALPHABET.toUpperCase()}`;
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#%^&*()-+={}[]:;|~<>,.?/';
const WHITESPACE_CHARS = '\f\n\r\t\v\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
const STRING_DELIMITER = '"';

describe('is identifier', () => {
	it('does not increment index', () => {
		const ctx = create_scanner_context('hello');
		is_identifier(ctx);
		expect(ctx.index).toEqual(0);
	});
	it('does emit false at EOF', () => {
		const ctx = create_scanner_context('');
		expect(is_identifier(ctx)).toBeFalsy();
	});
	it('does emit true for all identifier chars', () => {
		const ctx = create_scanner_context(IDENTIFIER_CHARS);

		for (let i = 0; i < IDENTIFIER_CHARS.length; i++) {
			expect(is_identifier(ctx, i)).toBeTruthy();
		}
	});
	it('does emit false for all number chars', () => {
		const ctx = create_scanner_context(NUMBER_CHARS);

		for (let i = 0; i < NUMBER_CHARS.length; i++) {
			expect(is_identifier(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all symbol chars', () => {
		const ctx = create_scanner_context(SYMBOL_CHARS);

		for (let i = 0; i < SYMBOL_CHARS.length; i++) {
			expect(is_identifier(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all whitespace chars', () => {
		const ctx = create_scanner_context(WHITESPACE_CHARS);

		for (let i = 0; i < WHITESPACE_CHARS.length; i++) {
			expect(is_identifier(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for string delimiter', () => {
		const ctx = create_scanner_context(STRING_DELIMITER);
		expect(is_identifier(ctx, 0)).toBeFalsy();
	});
});

describe('is number', () => {
	it('does not increment index', () => {
		const ctx = create_scanner_context('hello');
		is_number(ctx);
		expect(ctx.index).toEqual(0);
	});
	it('does emit false at EOF', () => {
		const ctx = create_scanner_context('');
		expect(is_number(ctx)).toBeFalsy();
	});
	it('does emit false for all identifier chars', () => {
		const ctx = create_scanner_context(IDENTIFIER_CHARS);

		for (let i = 0; i < IDENTIFIER_CHARS.length; i++) {
			expect(is_number(ctx, i)).toBeFalsy();
		}
	});
	it('does emit true for all number chars', () => {
		const ctx = create_scanner_context(NUMBER_CHARS);

		for (let i = 0; i < NUMBER_CHARS.length; i++) {
			expect(is_number(ctx, i)).toBeTruthy();
		}
	});
	it('does emit false for all symbol chars', () => {
		const ctx = create_scanner_context(SYMBOL_CHARS);

		for (let i = 0; i < SYMBOL_CHARS.length; i++) {
			expect(is_number(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all whitespace chars', () => {
		const ctx = create_scanner_context(WHITESPACE_CHARS);

		for (let i = 0; i < WHITESPACE_CHARS.length; i++) {
			expect(is_number(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for string delimiter', () => {
		const ctx = create_scanner_context(STRING_DELIMITER);
		expect(is_number(ctx, 0)).toBeFalsy();
	});
});

describe('is symbol', () => {
	it('does not increment index', () => {
		const ctx = create_scanner_context('hello');
		is_symbol(ctx);
		expect(ctx.index).toEqual(0);
	});
	it('does emit false at EOF', () => {
		const ctx = create_scanner_context('');
		expect(is_symbol(ctx)).toBeFalsy();
	});
	it('does emit false for all identifier chars', () => {
		const ctx = create_scanner_context(IDENTIFIER_CHARS);

		for (let i = 0; i < IDENTIFIER_CHARS.length; i++) {
			expect(is_symbol(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all number chars', () => {
		const ctx = create_scanner_context(NUMBER_CHARS);

		for (let i = 0; i < NUMBER_CHARS.length; i++) {
			expect(is_symbol(ctx, i)).toBeFalsy();
		}
	});
	it('does emit true for all symbol chars', () => {
		const ctx = create_scanner_context(SYMBOL_CHARS);

		for (let i = 0; i < SYMBOL_CHARS.length; i++) {
			expect(is_symbol(ctx, i)).toBeTruthy();
		}
	});
	it('does emit false for all whitespace chars', () => {
		const ctx = create_scanner_context(WHITESPACE_CHARS);

		for (let i = 0; i < WHITESPACE_CHARS.length; i++) {
			expect(is_symbol(ctx, i)).toBeFalsy();
		}
	});

	it('does emit false for string delimiter', () => {
		const ctx = create_scanner_context(STRING_DELIMITER);
		expect(is_symbol(ctx, 0)).toBeFalsy();
	});
});

describe('is string', () => {
	it('does not increment index', () => {
		const ctx = create_scanner_context('hello');
		is_string(ctx);
		expect(ctx.index).toEqual(0);
	});
	it('does emit false at EOF', () => {
		const ctx = create_scanner_context('');
		expect(is_string(ctx)).toBeFalsy();
	});
	it('does emit false for all identifier chars', () => {
		const ctx = create_scanner_context(IDENTIFIER_CHARS);

		for (let i = 0; i < IDENTIFIER_CHARS.length; i++) {
			expect(is_string(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all number chars', () => {
		const ctx = create_scanner_context(NUMBER_CHARS);

		for (let i = 0; i < NUMBER_CHARS.length; i++) {
			expect(is_string(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all symbol chars', () => {
		const ctx = create_scanner_context(SYMBOL_CHARS);

		for (let i = 0; i < SYMBOL_CHARS.length; i++) {
			expect(is_string(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all whitespace chars', () => {
		const ctx = create_scanner_context(WHITESPACE_CHARS);

		for (let i = 0; i < WHITESPACE_CHARS.length; i++) {
			expect(is_string(ctx, i)).toBeFalsy();
		}
	});

	it('does emit true for string delimiter', () => {
		const ctx = create_scanner_context(STRING_DELIMITER);
		expect(is_string(ctx, 0)).toBeTruthy();
	});
});

describe('is whitespace', () => {
	it('does not increment index', () => {
		const ctx = create_scanner_context('hello');
		is_whitespace(ctx);
		expect(ctx.index).toEqual(0);
	});
	it('does emit false at EOF', () => {
		const ctx = create_scanner_context('');
		expect(is_whitespace(ctx)).toBeFalsy();
	});
	it('does emit false for all identifier chars', () => {
		const ctx = create_scanner_context(IDENTIFIER_CHARS);

		for (let i = 0; i < IDENTIFIER_CHARS.length; i++) {
			expect(is_whitespace(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all number chars', () => {
		const ctx = create_scanner_context(NUMBER_CHARS);

		for (let i = 0; i < NUMBER_CHARS.length; i++) {
			expect(is_whitespace(ctx, i)).toBeFalsy();
		}
	});
	it('does emit false for all symbol chars', () => {
		const ctx = create_scanner_context(SYMBOL_CHARS);

		for (let i = 0; i < SYMBOL_CHARS.length; i++) {
			expect(is_whitespace(ctx, i)).toBeFalsy();
		}
	});
	it('does emit true for all whitespace chars', () => {
		const ctx = create_scanner_context(WHITESPACE_CHARS);

		for (let i = 0; i < WHITESPACE_CHARS.length; i++) {
			expect(is_whitespace(ctx, i)).toBeTruthy();
		}
	});

	it('does emit false for string delimiter', () => {
		const ctx = create_scanner_context(STRING_DELIMITER);
		expect(is_whitespace(ctx, 0)).toBeFalsy();
	});
});