export function escapeLikePattern(value: string): string {
    return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export function toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
}
