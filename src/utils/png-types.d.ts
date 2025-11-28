declare module 'png-chunks-extract' {
  interface Chunk {
    name: string;
    data: Uint8Array;
  }
  function extractChunks(data: Uint8Array): Chunk[];
  export = extractChunks;
}

declare module 'png-chunks-encode' {
  interface Chunk {
    name: string;
    data: Uint8Array;
  }
  function encodeChunks(chunks: Chunk[]): Uint8Array;
  export = encodeChunks;
}

declare module 'png-chunk-text' {
  interface DecodedText {
    keyword: string;
    text: string;
  }
  interface Chunk {
    name: string;
    data: Uint8Array;
  }
  export function encode(keyword: string, text: string): Chunk;
  export function decode(data: Uint8Array): DecodedText;
}
