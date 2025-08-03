import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(request, response) {
  // --- BAGIAN UNTUK MEMBUAT ACARA BARU (CREATE) ---
  if (request.method === 'POST') {
    const { title, date, points, is_mandatory, organizer } = request.body;
    if (!title || !date || !organizer) {
      return response.status(400).json({ message: 'Title, date, and organizer are required.' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO events(title, date, points, is_mandatory, organizer) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [title, date, points || 0, is_mandatory || false, organizer]
      );
      return response.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating event:', error);
      return response.status(500).json({ message: 'Internal Server Error' });
    }
  }
  
  // --- BAGIAN UNTUK MENGAMBIL DAFTAR ACARA (READ)
  if (request.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT * FROM events ORDER BY date DESC;');
      return response.status(200).json(rows);
    } catch (error) {
      console.error('Database Error:', error);
      return response.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // Jika metode lain, tolak
  return response.status(405).json({ message: 'Method Not Allowed' });
}