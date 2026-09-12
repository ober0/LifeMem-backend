import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { appConstants } from '../../../common/config/app.constants';
import { PrismaService } from '../../prisma/prisma.service';

type PersonSearchRow = {
    id: string;
    name: string;
};

type PlaceSearchRow = {
    id: string;
    name: string;
    full_name: string | null;
    latitude: string | null;
    longitude: string | null;
};

@Injectable()
export class UserEntitiesSearchRepository {
    constructor(private readonly prisma: PrismaService) {}

    async searchPeople(userId: string, queries: string[]) {
        const normalized = this.normalizeQueries(queries);
        if (normalized.length === 0) {
            return [];
        }

        const minScore = appConstants.ai.entitySearch.trgmMinScore;
        const containsBoost = appConstants.ai.entitySearch.containsBoostScore;
        const take = appConstants.ai.entitySearch.defaultTake;

        const rows = await this.prisma.$queryRaw<PersonSearchRow[]>(Prisma.sql`
            SELECT id, name
            FROM (
                SELECT
                    p.id,
                    p.name,
                    MAX(
                        GREATEST(
                            similarity(p.name, q.query),
                            word_similarity(q.query, p.name),
                            CASE
                                WHEN p.name ILIKE '%' || q.query || '%' THEN ${containsBoost}
                                ELSE 0
                            END
                        )
                    ) AS score
                FROM person p
                CROSS JOIN unnest(${normalized}::text[]) AS q(query)
                WHERE p.user_id = ${userId}::uuid
                  AND (
                      p.name ILIKE '%' || q.query || '%'
                      OR p.name OPERATOR(public.%) q.query
                      OR similarity(p.name, q.query) >= ${minScore}
                      OR word_similarity(q.query, p.name) >= ${minScore}
                  )
                GROUP BY p.id, p.name
            ) ranked
            WHERE score >= ${minScore}
            ORDER BY score DESC, name ASC
            LIMIT ${take}
        `);

        return rows;
    }

    async searchPlaces(userId: string, queries: string[], take = appConstants.ai.entitySearch.defaultTake) {
        const normalized = this.normalizeQueries(queries);
        if (normalized.length === 0) {
            return [];
        }

        const minScore = appConstants.ai.entitySearch.trgmMinScore;
        const containsBoost = appConstants.ai.entitySearch.containsBoostScore;

        const rows = await this.prisma.$queryRaw<PlaceSearchRow[]>(Prisma.sql`
            SELECT id, name, full_name, latitude, longitude
            FROM (
                SELECT
                    p.id,
                    p.name,
                    p.full_name,
                    p.latitude,
                    p.longitude,
                    MAX(
                        GREATEST(
                            similarity(p.name, q.query),
                            similarity(COALESCE(p.full_name, ''), q.query),
                            word_similarity(q.query, p.name),
                            word_similarity(q.query, COALESCE(p.full_name, '')),
                            CASE
                                WHEN p.name ILIKE '%' || q.query || '%'
                                  OR COALESCE(p.full_name, '') ILIKE '%' || q.query || '%'
                                THEN ${containsBoost}
                                ELSE 0
                            END
                        )
                    ) AS score
                FROM place p
                CROSS JOIN unnest(${normalized}::text[]) AS q(query)
                WHERE p.user_id = ${userId}::uuid
                  AND (
                      p.name ILIKE '%' || q.query || '%'
                      OR COALESCE(p.full_name, '') ILIKE '%' || q.query || '%'
                      OR p.name OPERATOR(public.%) q.query
                      OR COALESCE(p.full_name, '') OPERATOR(public.%) q.query
                      OR similarity(p.name, q.query) >= ${minScore}
                      OR similarity(COALESCE(p.full_name, ''), q.query) >= ${minScore}
                      OR word_similarity(q.query, p.name) >= ${minScore}
                      OR word_similarity(q.query, COALESCE(p.full_name, '')) >= ${minScore}
                  )
                GROUP BY p.id, p.name, p.full_name, p.latitude, p.longitude
            ) ranked
            WHERE score >= ${minScore}
            ORDER BY score DESC, name ASC
            LIMIT ${take}
        `);

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            fullName: row.full_name,
            latitude: row.latitude != null ? row.latitude : null,
            longitude: row.longitude != null ? row.longitude : null
        }));
    }

    private normalizeQueries(queries: string[]): string[] {
        return [...new Set(queries.map((item) => item.trim()).filter(Boolean))];
    }
}
