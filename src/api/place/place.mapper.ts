import type { PlaceDto } from './dto/place.dto';

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
    }
};
