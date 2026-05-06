const express = require('express');
const { Pool } = require('pg'); // Library Postgres
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi Koneksi PostgreSQL
const pool = new Pool({
  user: 'postgres',        // username default postgres
  host: 'localhost',
  database: 'sidequest', // pastikan db sudah dibuat
  password: 'PIa1234!', // isi password postgres kamu
  port: 5432,
});

// --- API ROUTES ---

// 1. Ambil List Lomba
app.get('/api/competitions', async (req, res) => {
  const { cat } = req.query;
  try {
    let query = `
      SELECT c.*, cat.slug as category_slug 
      FROM competitions c 
      JOIN categories cat ON c.category_id = cat.id
    `;
    let values = [];

    if (cat && cat !== 'all') {
      query += ` WHERE cat.slug = $1`;
      values.push(cat);
    }

    const result = await pool.query(query, values);
    
    // Mapping data agar cocok dengan frontend (data.js)
    const formattedData = result.rows.map(row => ({
      id: row.id,
      cat: row.category_slug,
      title: row.title,
      org: row.organizer,
      deadline: row.deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      daysLeft: Math.ceil((new Date(row.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
      tags: row.tags,
      color: row.color_gradient,
      emoji: row.emoji,
      free: row.is_free,
      prize: row.prize,
      desc: row.description
    }));

    res.json(formattedData);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 2. Ambil Profil User (ID: 1 sebagai contoh)
app.get('/api/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Ambil data user
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).send("User not found");

    // Ambil skill user
    const skillRes = await pool.query(`
      SELECT s.name as label, s.tag_class as cls 
      FROM skills s 
      JOIN user_skills us ON s.id = us.skill_id 
      WHERE us.user_id = $1
    `, [userId]);

    const user = userRes.rows[0];
    res.json({
      name: user.name,
      prodi: user.prodi,
      uni: user.university,
      bio: user.bio,
      initials: user.name.split(' ').map(n => n[0]).join(''),
      skills: skillRes.rows,
      stats: { lombaIkuti: 7, timAktif: 3, undangan: 2, matchRate: "92%" }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 3. Ambil Kandidat Matchmaking
app.get('/api/matchmaking', async (req, res) => {
  try {
    // Mengambil user lain sebagai rekomendasi
    const result = await pool.query(`
      SELECT id, name, university as uni, prodi, avatar_color 
      FROM users 
      WHERE id != 1 
      LIMIT 5
    `);
    
    const matches = result.rows.map(u => ({
      ...u,
      compat: Math.floor(Math.random() * 20) + 75,
      online: Math.random() > 0.5,
      skills: ['UI/UX', 'Figma', 'Postgres'],
      exp: ['Finalis Gemastik 2025'],
      prestasi: ['Ksatria Data']
    }));

    res.json(matches);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend SideQuest berjalan di http://localhost:${PORT}`);
});
