import { appConstants } from '../../../common/config/app.constants';

const maxPlaces = appConstants.entry.maxPlacesPerEntry;

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
                description:
                    `Новые локации по координатам — JSON-массив объектов ` +
                    `{ latitude, longitude, locationLabel? }. ` +
                    `Каждый элемент должен содержать latitude и longitude. ` +
                    `locationLabel опционален (своё имя места). ` +
                    `Сумма элементов location и placeIds не больше ${maxPlaces}. `,
                example:
                    '[{"latitude":55.7539,"longitude":37.6208},{"latitude":55.8091,"longitude":37.7983},{"latitude":40.7829,"longitude":-73.9654}]'
            },
            personIds: {
                type: 'string',
                description: 'JSON-массив UUID связанных людей',
                example: '["a1b2c3d4-e5f6-4789-a012-3456789abcde"]'
            },
            placeIds: {
                type: 'string',
                description:
                    `JSON-массив UUID уже созданных мест. ` +
                    `Сумма placeIds и элементов location не больше ${maxPlaces}.`,
                example: '["b2c3d4e5-f6a7-4890-b123-456789abcdef"]'
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
