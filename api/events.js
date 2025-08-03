import { Pool } from 'pg';

// Membuat koneksi pool ke database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(request, response) {
  // Hanya izinkan metode GET
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Mengambil semua data dari tabel 'events'
    const { rows } = await pool.query('SELECT * FROM events ORDER BY date ASC;');
    // Mengirim data sebagai response JSON
    return response.status(200).json(rows);
  } catch (error) {
    console.error('Database Error:', error);
    // Mengirim response error jika terjadi masalah
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}