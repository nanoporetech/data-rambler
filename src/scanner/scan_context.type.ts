export interface ScanContext {
	readonly source: string[];

	index: number;
	readonly length: number;

	column: number;
	row: number;
}