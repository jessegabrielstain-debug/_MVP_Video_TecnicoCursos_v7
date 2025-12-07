import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DIRECT_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const formatIdentifier = (value) => `"${value.replace(/"/g, '""')}"`;

const query = `
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'projects' AND column_name = 'id')
      OR column_name = 'project_id'
    )
  ORDER BY table_name, column_name;
`;

(async () => {
  try {
    await client.connect();
    const res = await client.query(query);
    console.table(res.rows);

    const tablesToCheck = res.rows
      .filter((row) => row.column_name === 'project_id')
      .map((row) => row.table_name);

    if (tablesToCheck.length > 0) {
      console.log('\nInvalid UUID scan:');
      for (const tableName of tablesToCheck) {
        const identifier = formatIdentifier(tableName);
        const { rows } = await client.query(
          `SELECT COUNT(*) AS invalid FROM public.${identifier}
           WHERE project_id IS NOT NULL
             AND NOT (project_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')`
        );
        const invalidCount = Number(rows[0]?.invalid ?? 0);
        console.log(`- ${tableName}: ${invalidCount} invalid rows`);
      }
    }
  } catch (error) {
    console.error('Query failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
