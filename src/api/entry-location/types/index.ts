import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

import { OpenstreetReverseResponse } from '../../openstreetmap/types';

export interface CreateLocationDto extends Partial<Omit<OpenstreetReverseResponse, 'shortName'>> {
    shortName: string;
    latitude?: number | null;
    longitude?: number | null;
}

export const detectedPersonSchema = z.object({
    name: z.string(),
    exists: z.boolean(),
    id: z.string().nullable().optional()
});

export const detectedPlaceSchema = z.object({
    name: z.string(),
    exists: z.boolean(),
    id: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional()
});

export const detectPeoplePlacesZodSchema = z.object({
    people: z.array(detectedPersonSchema),
    places: z.array(detectedPlaceSchema)
});

export const detectPeoplePlacesParser = StructuredOutputParser.fromZodSchema(detectPeoplePlacesZodSchema);

export const detectPeoplePlacesFormatInstructions = detectPeoplePlacesParser.getFormatInstructions();

export type DetectedPersonResult = z.infer<typeof detectedPersonSchema>;
export type DetectedPlaceResult = z.infer<typeof detectedPlaceSchema>;
export type DetectPeoplePlacesResult = z.infer<typeof detectPeoplePlacesZodSchema>;
