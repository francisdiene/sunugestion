
import { Pool, PoolClient } from 'pg'
import fs from 'fs'
import path from 'path'

const caPath = path.join(
  process.cwd(),
  'certs',
  'prod-ca-2021.crt'
)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync(caPath, 'utf8'),
    rejectUnauthorized: true,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function getClient(tenantId: string): Promise<PoolClient> {
  const client = await pool.connect()

  try {
    await client.query(
      "SELECT set_config('app.tenant_id', $1, false)",
      [tenantId]
    )
    return client
  } catch (error) {
    client.release()
    throw error
  }
}

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
