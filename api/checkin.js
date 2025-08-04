import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(request, response) {
  // Log a new request has been received
  console.log('Received request for /api/checkin');

  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { qrCodeData } = request.body;
  
  // Log the received QR data
  console.log('QR Code Data Received:', qrCodeData);

  if (!qrCodeData || !qrCodeData.startsWith('reg-')) {
    console.log('Validation failed: Invalid QR Code format.');
    return response.status(400).json({ message: 'Invalid QR Code data format.' });
  }

  const registrationId = parseInt(qrCodeData.split('-')[1]);

  if (isNaN(registrationId)) {
    console.log('Validation failed: Invalid registration ID.');
    return response.status(400).json({ message: 'Invalid registration ID.' });
  }

  try {
    const existingAttendance = await pool.query(
      'SELECT attendance_id FROM attendance WHERE registration_id = $1',
      [registrationId]
    );

    if (existingAttendance.rows.length > 0) {
      console.log(`Check-in failed: Registration ID ${registrationId} already checked in.`);
      return response.status(409).json({ message: 'This QR code has already been checked in.' });
    }

    await pool.query(
      'INSERT INTO attendance (registration_id, check_in_time) VALUES ($1, NOW())',
      [registrationId]
    );
    
    console.log(`Check-in successful for Registration ID: ${registrationId}`);
    return response.status(200).json({ message: 'Check-in successful!' });

  } catch (error) {
    console.error('Database Error:', error);
    if (error.code === '23503') {
      return response.status(404).json({ message: 'Registration not found.' });
    }
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}