import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';

function EventDetail() {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          eventId: parseInt(id)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setRegistrationId(data.registrationId);
      setIsRegistered(true);

    } catch (err) {
      setError(err.message);
    }
  };

  if (isRegistered) {

    return <QRCodeDisplay registrationId={registrationId} />;
  }

  return (
    <div className="form-container">
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
            // DITAMBAHKAN DI SINI
            autoComplete="name"
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
            // DITAMBAHKAN DI SINI
            autoComplete="email"
            required
          />
        </div>
        <button type="submit" className="btn">Register</button>
      </form>
    </div>
  );
}

export default EventDetail;