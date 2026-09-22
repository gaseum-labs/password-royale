import crypto from 'node:crypto';

export const newRandomSnowflake = (): string => {
	const timestamp = BigInt(Date.now());
	const worker = BigInt(crypto.randomInt(1 << 22));
	const snowflake = (timestamp << 22n) | worker;
	return snowflake.toString();
};

export const parseSnowflake = (
	snowflake: string,
): [number, number, number, number] => {
	const value = BigInt(snowflake);
	const timestamp = Number(value >> 22n);
	const workerId = Number((value & 0x3e0000n) >> 17n);
	const processId = Number((value & 0x1f000n) >> 12n);
	const increment = Number(value & 0xfffn);
	return [timestamp, workerId, processId, increment];
};
