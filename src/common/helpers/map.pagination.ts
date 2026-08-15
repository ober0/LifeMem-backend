import { PaginationDto } from '../types/pagination-dto';

export const mapPagination = (dto?: PaginationDto) => {
    return {
        take: dto?.count,
        skip: dto?.page ? (dto.page - 1) * dto.count : undefined
    };
};
