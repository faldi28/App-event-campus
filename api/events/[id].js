import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(request, response) {
  const { id } = request.query;

  // Pastikan ID valid sebelum melanjutkan
  if (isNaN(parseInt(id))) {
    return response.status(400).json({ message: 'Invalid event ID.' });
  }

  // --- Logika untuk UPDATE (PUT) ---
  if (request.method === 'PUT') {
    const { title, date, points, is_mandatory, organizer } = request.body;
    if (!title || !date || !organizer) {
      return response.status(400).json({ message: 'Title, date, and organizer are required.' });
    }
    try {
      const result = await pool.query(
        'UPDATE events SET title = $1, date = $2, points = $3, is_mandatory = $4, organizer = $5 WHERE event_id = $6 RETURNING *',
        [title, date, points, is_mandatory, organizer, id]
      );
      // Pastikan ada baris yang ter-update
      if (result.rowCount === 0) {
        return response.status(404).json({ message: 'Event not found' });
      }
      // Kirim kembali data yang sudah diupdate sebagai konfirmasi
      return response.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error updating event:', error);
      return response.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // --- Logika untuk DELETE ---
  if (request.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM events WHERE event_id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
        return response.status(404).json({ message: 'Event not found' });
      }
      return response.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      if (error.code === '23503') {
        return response.status(409).json({ message: 'Cannot delete event because it has registrations.' });
      }
      return response.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // Jika metode bukan PUT atau DELETE, tolak
  return response.status(405).json({ message: 'Method Not Allowed' });
}