export const removeFromArray = <T>(array: T[], element: T): void => {};

declare global {
	interface Array<T> {
		remove(element: T): void;
		isEmpty(): boolean;
	}
	interface Map<K, V> {
		getOrSet(key: K, orSet: (() => V) | V): V;
	}
}

Array.prototype.remove = function <T>(element: T): void {
	const index = this.indexOf(element);
	if (index !== -1) this.splice(index, 1);
};

Array.prototype.isEmpty = function (): boolean {
	return this.length === 0;
};

Map.prototype.getOrSet = function <K, V>(key: K, orSet: (() => V) | V): V {
	let value = this.get(key);
	if (value == null) {
		value = typeof orSet === 'function' ? (orSet as Function)() : orSet;
		this.set(key, value);
	}
	return value;
};

export const spaceship = (a: number, b: number): number => {
	return a < b ? -1 : a > b ? 1 : 0;
};

export const coerceArray = <T>(a: T[] | T): T[] => {
	return Array.isArray(a) ? a : [a];
};
