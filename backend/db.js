const { Client } = require('pg');

const getClient = async (tenantId) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  if (tenantId) {

    await client.query(`SET search_path TO ${tenantId}, public;`);
  }
  return client;
};

module.exports = { getClient };