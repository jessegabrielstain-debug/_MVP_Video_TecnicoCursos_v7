/**
 * Data Layer - Exports centralizados
 * 
 * Este módulo exporta todas as utilities de data loading,
 * batching e caching do sistema.
 */

// DataLoader
export {
  DataLoader,
  DataLoaderRegistry,
  createDataLoader,
  createSupabaseLoader,
  batchResolve,
  resolveRelation,
  defaultCacheKeyFn,
  type DataLoaderOptions,
  type DataLoaderStats,
  type BatchLoadFn,
  type NullableResult,
} from './dataloader';
