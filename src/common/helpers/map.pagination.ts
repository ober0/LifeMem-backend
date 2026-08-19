import type { PaginationDto } from '../types/common/pagination-dto';

export const mapPagination = (dto?: PaginationDto) => {
    return {
        take: dto?.count ?? 10,
        skip: dto?.page ? (dto.page - 1) * dto.count : 0
    };
};
