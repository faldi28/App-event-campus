import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams
import QRCodeDisplay from './QRCodeDisplay';

function EventDetail() {
  const { id } = useParams(); // Dapatkan 'id' acara dari URL, contoh: /event/1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset pesan error

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          eventId: parseInt(id) // Kirim ID acara ke backend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Jika ada error dari backend (misal: sudah terdaftar), tampilkan pesannya
        throw new Error(data.message || 'Something went wrong');
      }

      // Jika berhasil, simpan registrationId dan tampilkan QR code
      setRegistrationId(data.registrationId);
      setIsRegistered(true);

    } catch (err) {
      setError(err.message); // Tampilkan pesan error di form
    }
  };

  if (isRegistered) {
    // Kirim ID pendaftaran ke komponen QR Code
    return <QRCodeDisplay registrationId={`reg-${registrationId}`} />;
  }

  return (
    <div className="form-container">
      {/* Judul event bisa dibuat dinamis dengan fetch data event berdasarkan ID */}
      <h2>Register for Event</h2> 
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn">Register</button>
      </form>
    </div>
  );
}

export default EventDetail;