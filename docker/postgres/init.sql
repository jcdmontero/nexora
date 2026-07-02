-- PostgreSQL Initialization Script for Nexora Platform
-- Optimized for performance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For trigram similarity searches
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- For GIN index support
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- For query monitoring

-- Create custom functions for performance
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create indexes for common queries (examples - adjust based on actual schema)
-- These are suggestions based on the audit findings

-- For full-text search on users
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_gin ON users USING gin(name gin_trgm_ops);

-- For full-text search on clientes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_nombres_gin ON clientes USING gin(nombres gin_trgm_ops);

-- For full-text search on productos
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_productos_nombre_gin ON productos USING gin(nombre gin_trgm_ops);

-- For tenant-scoped queries (composite indexes)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_module_active ON tenant_modules(tenant_id, is_active);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_facturas_tenant_estado ON sales_facturas(tenant_id, estado);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ordenes_tenant_estado ON sd_ordenes(tenant_id, estado);

-- For session cleanup
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- For cache performance
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cache_key ON cache(key);

-- Enable pg_stat_statements for monitoring
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = all;
ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET max_connections = 200;

-- Reload configuration
SELECT pg_reload_conf();
