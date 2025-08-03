import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // Kita akan mengidentifikasi mahasiswa via query parameter email
  const { email } = request.query;

  if (!email) {
    return response.status(400).json({ message: 'Email query parameter is required' });
  }

  try {
    // 1. Dapatkan data mahasiswa
    const studentRes = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
    if (studentRes.rows.length === 0) {
      return response.status(404).json({ message: 'Student not found' });
    }
    const student = studentRes.rows[0];

    // 2. Dapatkan riwayat acara yang didaftarkan
    const historyRes = await pool.query(`
      SELECT e.title, e.date, e.points
      FROM events e
      JOIN registrations r ON e.event_id = r.event_id
      WHERE r.student_id = $1
      ORDER BY e.date DESC;
    `, [student.student_id]);
    const eventHistory = historyRes.rows;

    // 3. Hitung total poin dari riwayat acara
    const totalPoints = eventHistory.reduce((sum, event) => sum + event.points, 0);

    // 4. Kirim semua data dalam satu paket
    return response.status(200).json({
      name: student.name,
      email: student.email,
      totalPoints: totalPoints,
      eventHistory: eventHistory,
    });

  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}