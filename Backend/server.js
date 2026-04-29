const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// supaya frontend bisa dibaca
app.use(express.static(path.join(__dirname, "../frontend")));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "041606",
  port: 5432,
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, full_name, email, bio, skills, preferences
      FROM users
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil data users" });
  }
});
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
