import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

/**
 * Retourne un client PostgreSQL avec le tenant_id injecté
 * via SET app.tenant_id pour activer le Row Level Security
 */
export async function getClient(tenantId: string): Promise<PoolClient> {
  const client = await pool.connect()
  // Injection du tenant_id — active les politiques RLS
  await client.query(`SET app.tenant_id = '${tenantId}'`)
  return client
}

/**
 * Helper pour exécuter une requête dans le contexte d'un tenant
 */
export async function query<T = any>(
  tenantId: string,
  sql: string,
  params?: any[]
): Promise<T[]> {
  const client = await getClient(tenantId)
  try {
    const result = await client.query(sql, params)
    return result.rows
  } finally {
    client.release()
  }
}

/**
 * Helper pour les transactions multi-requêtes
 */
export async function transaction<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient(tenantId)
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export default pool
