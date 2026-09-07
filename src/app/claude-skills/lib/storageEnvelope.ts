/**
 * Versioned Storage Envelope System (v2)
 * Provides schema-versioned serialization, multi-tier quota protection, and
 * seamless backwards-compatible migration for studio workspace state.
 */

export {
  type StorageEnvelope,
  STORAGE_KEY_V2,
  STORAGE_KEY_V1_LEGACY,
  CURRENT_SCHEMA_VERSION,
  saveToStorageEnvelope,
  loadFromStorageEnvelope,
} from "@/lib/storage";
