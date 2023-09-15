// file is used by sequelize cli for migrations https://sequelize.org/docs/v6/other-topics/migrations/
const { setUpDotenv } = require('../util/helper');
setUpDotenv();

module.exports = {
  development: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: "postgres",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    protocol: "postgres"
  }
}
