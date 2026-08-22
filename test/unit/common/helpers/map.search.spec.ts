import { Contains } from '../../../../src/common/helpers/contains.decorator';
import { mapSearch } from '../../../../src/common/helpers/map.search';
import { DateMinMaxFilterDto, NumberMinMaxFilterDto } from '../../../../src/common/types/search/min-max.filter.dto';

class DemoFilterDto {
    nickname?: string;
    email?: string;
    @Contains()
    roleId?: string;
    @Contains()
    isEmailVerified?: boolean;
    score?: NumberMinMaxFilterDto;
    createdAt?: DateMinMaxFilterDto;
    tagIds?: string[];
}

describe('mapSearch', () => {
    it('base map', () => {
        const where = mapSearch({ nickname: 'Alex', email: 'Test@Mail.com' }, [], [], undefined, [], DemoFilterDto);

        expect(where).toEqual({
            AND: [
                {
                    nickname: { contains: 'alex', mode: 'insensitive' },
                    email: { contains: 'test@mail.com', mode: 'insensitive' }
                }
            ]
        });
    });

    it('Contains map', () => {
        const where = mapSearch(
            { roleId: '11111111-1111-4111-8111-111111111111', isEmailVerified: true },
            [],
            [],
            undefined,
            [],
            DemoFilterDto
        );

        expect(where).toEqual({
            AND: [
                {
                    roleId: '11111111-1111-4111-8111-111111111111',
                    isEmailVerified: true
                }
            ]
        });
    });

    it('maps number and date ranges', () => {
        const score = Object.assign(new NumberMinMaxFilterDto(), { min: 1, max: 10 });
        const createdAt = Object.assign(new DateMinMaxFilterDto(), {
            from: new Date('2024-01-01T00:00:00.000Z'),
            to: new Date('2024-12-31T00:00:00.000Z')
        });

        const where = mapSearch({ score, createdAt }, [], [], undefined, [], DemoFilterDto);

        expect(where).toEqual({
            AND: [
                {
                    score: { gte: 1, lte: 10 },
                    createdAt: {
                        gte: createdAt.from,
                        lte: createdAt.to
                    }
                }
            ]
        });
    });

    it('maps *Ids arrays to in', () => {
        const where = mapSearch({ tagIds: ['a', 'b'] }, [], [], undefined, [], DemoFilterDto);

        expect(where).toEqual({
            AND: [
                {
                    tagId: { in: ['a', 'b'] }
                }
            ]
        });
    });

    it('applies modifiedPath nesting', () => {
        const where = mapSearch(
            { nickname: 'bob' },
            [{ key: 'nickname', path: 'user.nickname' }],
            [],
            undefined,
            [],
            DemoFilterDto
        );

        expect(where).toEqual({
            AND: [
                {
                    user: {
                        nickname: { contains: 'bob', mode: 'insensitive' }
                    }
                }
            ]
        });
    });

    it('adds OR query across queryFields', () => {
        const where = mapSearch(undefined, [], [], 'hello', ['nickname', 'email'], DemoFilterDto);

        expect(where).toEqual({
            AND: [
                {
                    OR: [
                        { nickname: { contains: 'hello', mode: 'insensitive' } },
                        { email: { contains: 'hello', mode: 'insensitive' } }
                    ]
                }
            ]
        });
    });

    it('skips empty values and excluded keys', () => {
        const where = mapSearch(
            { nickname: '  ', email: 'keep', roleId: undefined },
            [],
            ['email'],
            undefined,
            [],
            DemoFilterDto
        );

        expect(where).toEqual({});
    });

    it('combines filters and query', () => {
        const where = mapSearch({ isEmailVerified: false }, [], [], 'q', ['nickname'], DemoFilterDto);

        expect(where).toEqual({
            AND: [{ isEmailVerified: false }, { OR: [{ nickname: { contains: 'q', mode: 'insensitive' } }] }]
        });
    });
});
