export { openDatabase, getDbPath } from './connection.js'
export { initializeSchema } from './schema.js'
export {
  insertPackages,
  getPackageCount,
  getPackageNames,
  getPackageNamesNotEmbedded,
  getPackageId,
  insertEmbedding,
  insertEmbeddings,
  findSimilarByVector,
  createRun,
  insertResult,
  getRuns,
  getRunResults,
  getMeta,
  setMeta,
  getSyncMeta,
} from './queries.js'
