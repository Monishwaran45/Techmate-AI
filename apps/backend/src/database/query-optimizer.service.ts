import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';

/**
 * Service to help optimize database queries
 * Provides utilities for pagination, caching, and query optimization
 */
@Injectable()
export class QueryOptimizerService {
  /**
   * Apply pagination to a query builder
   */
  applyPagination<T>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 20,
  ): SelectQueryBuilder<T> {
    const skip = (page - 1) * limit;
    return queryBuilder.skip(skip).take(limit);
  }

  /**
   * Apply caching to a query builder
   */
  applyCaching<T>(
    queryBuilder: SelectQueryBuilder<T>,
    cacheKey: string,
    cacheDuration: number = 30000, // 30 seconds default
  ): SelectQueryBuilder<T> {
    return queryBuilder.cache(cacheKey, cacheDuration);
  }

  /**
   * Get paginated results with total count
   */
  async getPaginatedResults<T>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Apply common filters for user-scoped queries
   */
  applyUserFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    userId: string,
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    return queryBuilder.where(`${alias}.userId = :userId`, { userId });
  }

  /**
   * Apply date range filter
   */
  applyDateRangeFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    field: string,
    startDate?: Date,
    endDate?: Date,
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    if (startDate) {
      queryBuilder.andWhere(`${alias}.${field} >= :startDate`, { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere(`${alias}.${field} <= :endDate`, { endDate });
    }
    return queryBuilder;
  }

  /**
   * Apply sorting
   */
  applySorting<T>(
    queryBuilder: SelectQueryBuilder<T>,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    return queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);
  }

  /**
   * Create an optimized query for fetching user-specific data
   */
  createUserQuery<T>(
    repository: Repository<T>,
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      cache?: boolean;
      cacheDuration?: number;
    },
  ): SelectQueryBuilder<T> {
    const alias = repository.metadata.tableName;
    let queryBuilder = repository
      .createQueryBuilder(alias)
      .where(`${alias}.userId = :userId`, { userId });

    // Apply sorting
    if (options?.sortBy) {
      queryBuilder = this.applySorting(
        queryBuilder,
        options.sortBy,
        options.sortOrder,
        alias,
      );
    }

    // Apply pagination
    if (options?.page && options?.limit) {
      queryBuilder = this.applyPagination(
        queryBuilder,
        options.page,
        options.limit,
      );
    }

    // Apply caching
    if (options?.cache) {
      const cacheKey = `${alias}:user:${userId}:${options.page || 1}`;
      queryBuilder = this.applyCaching(
        queryBuilder,
        cacheKey,
        options.cacheDuration,
      );
    }

    return queryBuilder;
  }

  /**
   * Optimize a query by selecting only specific fields
   */
  selectFields<T>(
    queryBuilder: SelectQueryBuilder<T>,
    fields: string[],
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    const selectFields = fields.map((field) => `${alias}.${field}`);
    return queryBuilder.select(selectFields);
  }

  /**
   * Add eager loading for relations
   */
  loadRelations<T>(
    queryBuilder: SelectQueryBuilder<T>,
    relations: string[],
    alias: string = 'entity',
  ): SelectQueryBuilder<T> {
    relations.forEach((relation) => {
      queryBuilder.leftJoinAndSelect(`${alias}.${relation}`, relation);
    });
    return queryBuilder;
  }
}
