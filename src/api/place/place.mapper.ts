import type { PlaceDto } from './dto/place.dto';
import type { PlaceMapItemDto } from './dto/place-map.dto';

export const placeMapper = {
    toDto(place): PlaceDto {
        return {
            id: place.id,
            name: place.name,
            fullName: place.fullName,
            latitude: place.latitude?.toNumber() ?? null,
            longitude: place.longitude?.toNumber() ?? null,
            autodetected: place.autodetected,
            createdAt: place.createdAt,
            updatedAt: place.updatedAt
        };
    },

    toMapItem(place): PlaceMapItemDto {
        return {
            id: place.id,
            name: place.name,
            fullName: place.fullName,
            latitude: place.latitude.toNumber(),
            longitude: place.longitude.toNumber(),
            entries: place.entries.map((link) => ({
                id: link.entry.id,
                name: link.entry.title
            }))
        };
    }
};
