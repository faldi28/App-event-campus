import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { qrCodeData } = request.body;

  // Validasi data QR
  if (!qrCodeData || !qrCodeData.startsWith('reg-')) {
    return response.status(400).json({ message: 'Invalid QR Code data format.' });
  }

  // Ekstrak registration_id dari data QR (contoh: 'reg-12' -> 12)
  const registrationId = parseInt(qrCodeData.split('-')[1]);

  if (isNaN(registrationId)) {
    return response.status(400).json({ message: 'Invalid registration ID.' });
  }

  try {
    // 1. Cek apakah sudah pernah check-in sebelumnya
    const existingAttendance = await pool.query(
      'SELECT attendance_id FROM attendance WHERE registration_id = $1',
      [registrationId]
    );

    if (existingAttendance.rows.length > 0) {
      return response.status(409).json({ message: 'This QR code has already been checked in.' });
    }

    // 2. Jika belum, catat kehadiran baru dengan waktu saat ini
    await pool.query(
      'INSERT INTO attendance (registration_id, check_in_time) VALUES ($1, NOW())',
      [registrationId]
    );

    return response.status(200).json({ message: 'Check-in successful!' });

  } catch (error) {
    // Menangani kemungkinan jika registration_id tidak valid/ditemukan di DB
    if (error.code === '23503') { // Foreign key violation
      return response.status(404).json({ message: 'Registration not found.' });
    }
    console.error('Database Error:', error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}