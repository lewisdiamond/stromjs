export interface WithEncoding {
    encoding: string;
}

export enum SerializationFormats {
    utf8 = "utf8",
}

type JsonPrimitive = string | number | object;
export type JsonValue = JsonPrimitive | JsonPrimitive[];

export interface JsonParseOptions {
    pretty: boolean;
}
