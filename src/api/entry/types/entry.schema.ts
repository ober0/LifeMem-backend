import { appConstants } from '../../../common/config/app.constants';

export const createSchema = {
    schema: {
        type: 'object',
        oneOf: [
            {
                required: ['text']
            },
            {
                required: ['voice']
            }
        ],

        properties: {
            title: { type: 'string', example: 'Прогулка в парке' },
            text: { type: 'string', example: 'Были с девушкой, солнечно' },
            location: {
                type: 'string',
                description: 'JSON: { latitude, longitude, locationLabel? }',
                example: '{"latitude":55.7558,"longitude":37.6173,"locationLabel":"Парк"}'
            },
            personIds: {
                type: 'string',
                description: 'JSON-массив UUID',
                example: '["a1b2c3d4-e5f6-4789-a012-3456789abcde"]'
            },
            placeIds: {
                type: 'string',
                description: 'JSON-массив UUID',
                example: '["b2c3d4e5-f6a7-4890-b123-456789abcdef0"]'
            },
            photoDescriptions: {
                type: 'string',
                description: 'JSON-массив описаний в том же порядке, что и photos',
                example: '[null,"Мы на скамейке"]'
            },
            voice: { type: 'string', format: 'binary' },
            photos: {
                type: 'array',
                items: { type: 'string', format: 'binary' },
                maxItems: appConstants.entry.maxPhotosPerEntry
            }
        }
    }
};
