import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, eventId } = request.body;

  // Validasi input
  if (!name || !email || !eventId) {
    return response.status(400).json({ message: 'Name, email, and eventId are required' });
  }

  const client = await pool.connect();
  try {
    // Mulai transaksi untuk memastikan semua query berhasil atau tidak sama sekali
    await client.query('BEGIN');

    // 1. Cek apakah mahasiswa sudah ada berdasarkan email
    let studentResult = await client.query('SELECT student_id FROM students WHERE email = $1', [email]);
    let studentId;

    if (studentResult.rows.length > 0) {
      // Jika mahasiswa sudah ada, gunakan student_id yang ada
      studentId = studentResult.rows[0].student_id;
    } else {
      // Jika mahasiswa belum ada, buat data baru dan dapatkan student_id-nya
      const newStudentResult = await client.query(
        'INSERT INTO students (name, email) VALUES ($1, $2) RETURNING student_id',
        [name, email]
      );
      studentId = newStudentResult.rows[0].student_id;
    }

    // 2. Cek apakah mahasiswa sudah terdaftar di acara ini
    const registrationResult = await client.query(
      'SELECT registration_id FROM registrations WHERE student_id = $1 AND event_id = $2',
      [studentId, eventId]
    );

    if (registrationResult.rows.length > 0) {
      // Jika sudah terdaftar, batalkan transaksi dan kirim pesan error
      await client.query('ROLLBACK');
      return response.status(409).json({ message: 'You are already registered for this event.' });
    }

    // 3. Jika belum, daftarkan mahasiswa ke acara
    const newRegistration = await client.query(
      'INSERT INTO registrations (student_id, event_id) VALUES ($1, $2) RETURNING registration_id',
      [studentId, eventId]
    );
    const registrationId = newRegistration.rows[0].registration_id;

    // Selesaikan transaksi
    await client.query('COMMIT');

    return response.status(201).json({ message: 'Registration successful', registrationId });

  } catch (error) {
    // Jika ada error, batalkan semua perubahan
    await client.query('ROLLBACK');
    console.error('Database Transaction Error:', error);
    return response.status(500).json({ message: 'Internal Server Error' });
  } finally {
    // Lepaskan koneksi client kembali ke pool
    client.release();
  }
}