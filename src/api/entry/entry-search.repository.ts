import { Injectable } from '@nestjs/common';
import { EntryVectorKind, Prisma } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { mapPagination } from '../../common/helpers/map.pagination';
import { PrismaService } from '../prisma/prisma.service';
import { searchEntrySelect, type SearchEntrySource } from './consts/entry.constants';
import type { EntrySearchDto } from './dto/search/search-request.dto';
import { escapeLikePattern, toVectorLiteral } from './helpers/entry-search-query.helper';

export type RankedEntryHit = {
    id: string;
    score: number;
    distance: number;
};

type RankedEntryRow = {
    id: string;
    score: number;
    distance: number;
};

type CountRow = {
    count: bigint;
};

@Injectable()
export class EntrySearchRepository {
    constructor(private readonly prisma: PrismaService) {}

    async searchByQuery(
        userId: string,
        dto: EntrySearchDto,
        queryText: string,
        queryEmbedding: number[]
    ): Promise<SearchEntrySource[]> {
        const ranked = await this.findRankedEntryIds(userId, dto, queryText, queryEmbedding);

        if (ranked.length === 0) {
            return [];
        }

        const ids = ranked.map((hit) => hit.id);

        const entries = await this.prisma.entry.findMany({
            where: {
                id: { in: ids },
                userId,
                deletedAt: null
            },
            select: searchEntrySelect
        });

        const byId = new Map(entries.map((entry) => [entry.id, entry as unknown as SearchEntrySource]));

        return ids.map((id) => byId.get(id)).filter((entry): entry is SearchEntrySource => entry != null);
    }

    async countByQuery(
        userId: string,
        dto: EntrySearchDto,
        queryText: string,
        queryEmbedding: number[]
    ): Promise<number> {
        const params = this.buildQueryParams(userId, dto, queryText, queryEmbedding);

        const rows = await this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
            WITH candidates AS (
                ${this.candidatesSql(params)}
            )
            SELECT COUNT(DISTINCT entry_id)::bigint AS count
            FROM candidates
        `);

        return Number(rows[0]?.count ?? 0);
    }

    async findRankedEntryIds(
        userId: string,
        dto: EntrySearchDto,
        queryText: string,
        queryEmbedding: number[]
    ): Promise<RankedEntryHit[]> {
        const params = this.buildQueryParams(userId, dto, queryText, queryEmbedding);
        const { take, skip } = mapPagination(dto.pagination);

        const rows = await this.prisma.$queryRaw<RankedEntryRow[]>(Prisma.sql`
            WITH candidates AS (
                ${this.candidatesSql(params)}
            ),
            ranked AS (
                SELECT entry_id, MAX(score) AS score
                FROM candidates
                GROUP BY entry_id
            )
            SELECT
                r.entry_id AS id,
                r.score::float8 AS score,
                (1 - r.score)::float8 AS distance
            FROM ranked r
            INNER JOIN entry e ON e.id = r.entry_id
            ORDER BY r.score DESC, e.created_at DESC
            LIMIT ${take}
            OFFSET ${skip}
        `);

        return rows.map((row) => ({
            id: row.id,
            score: Number(row.score),
            distance: Number(row.distance)
        }));
    }

    private buildQueryParams(userId: string, dto: EntrySearchDto, queryText: string, queryEmbedding: number[]) {
        const likePattern = `%${escapeLikePattern(queryText)}%`;
        const dimensions = queryEmbedding.length;
        const vectorLiteral = toVectorLiteral(queryEmbedding);
        const search = appConstants.entry.search;

        return {
            userId,
            likePattern,
            dimensions,
            vectorLiteral,
            isReady: dto.filters?.isReady ?? null,
            useVector: queryText.length >= search.minQueryLengthForVector && queryEmbedding.length > 0,
            ...search
        };
    }

    private candidatesSql(params: ReturnType<EntrySearchRepository['buildQueryParams']>) {
        //     SELECT e.id AS entry_id, ${params.scoreTitleLike}::float8 AS score
        //     FROM entry e
        //     WHERE e.user_id = ${params.userId}::uuid
        //       AND e.deleted_at IS NULL
        //       AND (${params.isReady}::boolean IS NULL OR e.is_ready = ${params.isReady})
        //       AND e.title ILIKE ${params.likePattern} ESCAPE '\\'
        //
        //     UNION ALL
        //
        //     SELECT e.id AS entry_id, ${params.scoreTextLike}::float8 AS score
        //     FROM entry e
        //     WHERE e.user_id = ${params.userId}::uuid
        //       AND e.deleted_at IS NULL
        //       AND (${params.isReady}::boolean IS NULL OR e.is_ready = ${params.isReady})
        //       AND e.text IS NOT NULL
        //       AND e.text ILIKE ${params.likePattern} ESCAPE '\\'
        //
        //     UNION ALL
        //
        //     SELECT e.id AS entry_id, ${params.scoreImageLike}::float8 AS score
        //     FROM entry e
        //     INNER JOIN entry_image ei ON ei.entry_id = e.id
        //     WHERE e.user_id = ${params.userId}::uuid
        //       AND e.deleted_at IS NULL
        //       AND (${params.isReady}::boolean IS NULL OR e.is_ready = ${params.isReady})
        //       AND (
        //           (ei.description IS NOT NULL AND ei.description ILIKE ${params.likePattern} ESCAPE '\\')
        //           OR (ei.ai_transcription IS NOT NULL AND ei.ai_transcription ILIKE ${params.likePattern} ESCAPE '\\')
        //       )
        //
        //     UNION ALL

        return Prisma.sql`
            SELECT e.id AS entry_id, (1 - (ev.embedding <=> ${params.vectorLiteral}::vector))::float8 AS score
            FROM entry_vector ev
            INNER JOIN entry e ON e.id = ev.entry_id
            WHERE ${params.useVector}
              AND e.user_id = ${params.userId}::uuid
              AND e.deleted_at IS NULL
              AND (${params.isReady}::boolean IS NULL OR e.is_ready = ${params.isReady})
              AND ev.kind = ${EntryVectorKind.Text}::entry_vector_kind
              AND ev.dimensions = ${params.dimensions}
              AND ev.embedding IS NOT NULL
              AND (ev.embedding <=> ${params.vectorLiteral}::vector) <= ${params.vectorMaxCosineDistance}
              AND (1 - (ev.embedding <=> ${params.vectorLiteral}::vector)) >= ${params.vectorMinSimilarity}

            UNION ALL

            SELECT e.id AS entry_id, (1 - (ev.embedding <=> ${params.vectorLiteral}::vector))::float8 AS score
            FROM entry_vector ev
            INNER JOIN entry e ON e.id = ev.entry_id
            WHERE ${params.useVector}
              AND e.user_id = ${params.userId}::uuid
              AND e.deleted_at IS NULL
              AND (${params.isReady}::boolean IS NULL OR e.is_ready = ${params.isReady})
              AND ev.kind = ${EntryVectorKind.Title}::entry_vector_kind
              AND ev.dimensions = ${params.dimensions}
              AND ev.embedding IS NOT NULL
              AND (ev.embedding <=> ${params.vectorLiteral}::vector) <= ${params.vectorMaxCosineDistance}
              AND (1 - (ev.embedding <=> ${params.vectorLiteral}::vector)) >= ${params.vectorMinSimilarity}

            UNION ALL

            SELECT e.id AS entry_id, (1 - (ev.embedding <=> ${params.vectorLiteral}::vector))::float8 AS score
            FROM entry_vector ev
            INNER JOIN entry e ON e.id = ev.entry_id
            WHERE ${params.useVector}
              AND e.user_id = ${params.userId}::uuid
              AND e.deleted_at IS NULL
              AND (${params.isReady}::boolean IS NULL OR e.is_ready = ${params.isReady})
              AND ev.kind = ${EntryVectorKind.Image}::entry_vector_kind
              AND ev.dimensions = ${params.dimensions}
              AND ev.embedding IS NOT NULL
              AND (ev.embedding <=> ${params.vectorLiteral}::vector) <= ${params.vectorMaxCosineDistance}
              AND (1 - (ev.embedding <=> ${params.vectorLiteral}::vector)) >= ${params.vectorMinSimilarity}
        `;
    }
}
