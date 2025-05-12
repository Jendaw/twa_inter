const {Client} = require("pg")

const client = new Client ({
    host: "localhost",
    user: "postgres",
    port: 5433,
    password: "",
    database: "db_inter_banking"
})

client.connect()
module.exports = client;