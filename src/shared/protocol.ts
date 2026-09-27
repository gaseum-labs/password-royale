const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

const encodeChunk = (dataBuffer: Uint8Array, typeCode: number): Uint8Array => {
	const dataLength = dataBuffer.length;
	const subBuffer = new Uint8Array(5 + dataLength);

	writeUInt32(subBuffer, 0, dataLength);
	subBuffer[4] = typeCode;
	subBuffer.set(dataBuffer, 5);

	return subBuffer;
};

const writeUInt32 = (buffer: Uint8Array, index: number, number: number) => {
	buffer[index] = number >> 24;
	buffer[index + 1] = (number >> 16) & 0xff;
	buffer[index + 2] = (number >> 8) & 0xff;
	buffer[index + 3] = number & 0xff;
};

const readUInt32 = (buffer: Uint8Array, offset: number): number => {
	return (
		(buffer[offset] << 24) |
		(buffer[offset + 1] << 16) |
		(buffer[offset + 2] << 8) |
		buffer[offset + 3]
	);
};

export const encodeBinary = (chunks: (Uint8Array | unknown)[]): Uint8Array => {
	const parts: Uint8Array[] = [];
	let totalLength = 0;

	for (const chunk of chunks) {
		if (chunk instanceof Uint8Array) {
			const dataBuffer = encodeChunk(chunk, 0);
			parts.push(dataBuffer);
			totalLength += dataBuffer.length;
		} else {
			const encoded = textEncoder.encode(JSON.stringify(chunk));
			const dataBuffer = encodeChunk(encoded, 1);
			parts.push(dataBuffer);
			totalLength += dataBuffer.length;
		}
	}

	const finalBuffer = new Uint8Array(totalLength);
	let writeIndex = 0;
	for (const part of parts) {
		finalBuffer.set(part, writeIndex);
		writeIndex += part.length;
	}
	return finalBuffer;
};

export type DecodedPart =
	| { type: 'binary'; buffer: Uint8Array }
	| { type: 'json'; value: unknown };

export const decodeBinary = (buffer: Uint8Array): DecodedPart[] => {
	const parts: DecodedPart[] = [];

	let readIndex = 0;
	while (true) {
		if (readIndex + 5 >= buffer.length)
			throw Error('Not enough space to read header');
		const length = readUInt32(buffer, readIndex);
		const typeCode = buffer[readIndex + 4];
		if (typeCode > 1)
			throw Error(
				`Unknown type code ${typeCode} for block ${parts.length} | length=${length}`,
			);
		readIndex += 5;

		console.log(
			`block ${parts.length} | type ${typeCode} | length ${length}`,
		);

		if (readIndex + length > buffer.length)
			throw Error('Block length longer than buffer');
		const dataBuffer = buffer.slice(readIndex, readIndex + length);
		readIndex += length;

		if (typeCode === 0) {
			parts.push({
				type: 'binary',
				buffer: dataBuffer,
			});
		} else {
			const stringValue = textDecoder.decode(dataBuffer);
			console.log('stringvalue:', stringValue);
			const json = JSON.parse(stringValue);
			parts.push({
				type: 'json',
				value: json,
			});
		}

		if (readIndex === buffer.length) break;
	}

	return parts;
};

const NO_PART = Symbol();

export const getOnlyJsonPart = (parts: DecodedPart[]): unknown => {
	let jsonPart: typeof NO_PART | unknown = NO_PART;
	for (const part of parts) {
		if (part.type !== 'json') continue;
		if (jsonPart !== NO_PART) throw Error('Multiple json parts');
		jsonPart = part.value;
	}
	if (jsonPart === NO_PART) throw Error('No json part');
	return jsonPart;
};

export const getPartAsBinary = (
	parts: DecodedPart[],
	index: number,
): Uint8Array => {
	const part = parts[index];
	if (part.type === 'json') throw Error(`Part ${index} is json`);
	return part.buffer;
};
