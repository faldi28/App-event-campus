import { Pool } from 'pg';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import QRCode from 'qrcode';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const s3Client = new S3Client({
  endpoint: `https://{process.env.DO_SPACES_ENDPOINT}`,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ message: 'Event ID is required' });

  const client = await pool.connect();
  try {
    const attendees = await client.query(`
      SELECT s.name, e.title, r.registration_id
      FROM students s
      JOIN registrations r ON s.student_id = r.student_id
      JOIN events e ON r.event_id = e.event_id
      JOIN attendance a ON r.registration_id = a.registration_id
      WHERE e.event_id = $1;
    `, [eventId]);

    if (attendees.rows.length === 0) {
      return res.status(404).json({ message: 'No checked-in attendees found for this event.' });
    }

    for (const attendee of attendees.rows) {
      // 1. Buat record sertifikat di DB untuk mendapatkan UUID
      const certRecord = await client.query(
        'INSERT INTO certificates (registration_id) VALUES ($1) RETURNING certificate_id',
        [attendee.registration_id]
      );
      const certificateId = certRecord.rows[0].certificate_id;

      // 2. Buat PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      page.drawText('Certificate of Attendance', { x: 50, y: 500, font, size: 50, color: rgb(0, 0, 0) });
      page.drawText('This certifies that', { x: 50, y: 420, font, size: 20 });
      page.drawText(attendee.name, { x: 50, y: 380, font, size: 30, color: rgb(0.1, 0.5, 0.8) });
      page.drawText(`has attended the event: ${attendee.title}`, { x: 50, y: 320, font, size: 20 });

      // 3. Buat QR Code Verifikasi
      const verificationUrl = `http://localhost:5173/verify/${certificateId}`; // Ganti dengan URL produksi Anda nanti
      const qrImage = await QRCode.toDataURL(verificationUrl);
      const qrImageBytes = await fetch(qrImage).then(res => res.arrayBuffer());
      const embeddedQrImage = await pdfDoc.embedPng(qrImageBytes);
      page.drawImage(embeddedQrImage, { x: 50, y: 50, width: 100, height: 100 });

      // 4. Simpan PDF ke buffer
      const pdfBytes = await pdfDoc.save();

      // 5. Upload ke DigitalOcean Spaces
      const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: `certificates/${certificateId}.pdf`,
        Body: pdfBytes,
        ACL: 'public-read',
        ContentType: 'application/pdf',
      };
      await s3Client.send(new PutObjectCommand(params));
      const certificateUrl = `https://{process.env.DO_SPACES_BUCKET}.{process.env.DO_SPACES_ENDPOINT}/certificates/${certificateId}.pdf`;

      // 6. Update record DB dengan URL sertifikat
      await client.query('UPDATE certificates SET certificate_url = $1 WHERE certificate_id = $2', [certificateUrl, certificateId]);
    }

    res.status(200).json({ message: `Successfully generated ${attendees.rows.length} certificates.` });
  } catch (error) {
    console.error('Certificate Generation Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
}