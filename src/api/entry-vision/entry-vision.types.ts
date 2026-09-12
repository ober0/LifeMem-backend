import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

export const entryImageVisionMetadataSchema = z.object({
    description: z.string().describe('Plain-text description of the photo (2–5 sentences)'),
    objects: z.array(z.string()).describe('Notable objects, people, or animals visible in the image'),
    scene: z.string().nullable().describe('Type of setting or scene, or null if unclear'),
    time: z.string().nullable().describe('Time of day or era if inferable, otherwise null'),
    activity: z.string().nullable().describe('Main activity happening, otherwise null')
});

export const entryImageVisionMetadataParser = StructuredOutputParser.fromZodSchema(entryImageVisionMetadataSchema);

export const entryImageVisionMetadataFormatInstructions = entryImageVisionMetadataParser.getFormatInstructions();

export type EntryImageVisionMetadata = z.infer<typeof entryImageVisionMetadataSchema>;

export function parseEntryImageVisionMetadata(value: unknown): EntryImageVisionMetadata | null {
    const parsed = entryImageVisionMetadataSchema.safeParse(value);

    return parsed.success ? parsed.data : null;
}

export function formatVisionMetadataForEmbed(metadata: EntryImageVisionMetadata): string {
    const lines = [metadata.description.trim()];

    if (metadata.objects.length > 0) {
        lines.push(`Objects: ${metadata.objects.join(', ')}`);
    }

    if (metadata.scene?.trim()) {
        lines.push(`Scene: ${metadata.scene.trim()}`);
    }

    if (metadata.time?.trim()) {
        lines.push(`Time: ${metadata.time.trim()}`);
    }

    if (metadata.activity?.trim()) {
        lines.push(`Activity: ${metadata.activity.trim()}`);
    }

    return lines.join('\n');
}

export function buildEntryImageEmbedText(params: {
    description: string | null;
    aiTranscription: string | null;
    aiMetadata: unknown;
}): string {
    const parts: string[] = [];

    if (params.description?.trim()) {
        parts.push(params.description.trim());
    }

    const metadata = parseEntryImageVisionMetadata(params.aiMetadata);
    if (metadata) {
        parts.push(formatVisionMetadataForEmbed(metadata));
    } else if (params.aiTranscription?.trim()) {
        parts.push(params.aiTranscription.trim());
    }

    return parts.join('\n\n');
}
