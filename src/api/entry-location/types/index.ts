import { OpenstreetReverseResponse } from '../../openstreetmap/types';

export interface CreateLocationDto extends Partial<Omit<OpenstreetReverseResponse, 'shortName'>> {
    shortName: string;
    latitude: number;
    longitude: number;
}
