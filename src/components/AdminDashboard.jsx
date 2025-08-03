import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

// State awal untuk form acara
const initialFormState = { title: '', date: '', points: 0, is_mandatory: false, organizer: '' };

function AdminDashboard() {
  // --- STATE UNTUK MANAJEMEN ACARA ---
  const [events, setEvents] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  // --- STATE UNTUK SCANNER QR ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState({ type: '', text: '' });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  // --- FUNGSI MANAJEMEN ACARA ---

  const fetchEvents = async () => {
    const response = await fetch('/api/events');
    const data = await response.json();
    setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentEvent({ ...currentEvent, [name]: type === 'checkbox' ? checked : value });
  };

  const handleEditClick = (event) => {
    const formattedEvent = { ...event, date: new Date(event.date).toISOString().split('T')[0] };
    setCurrentEvent(formattedEvent);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setCurrentEvent(initialFormState);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `/api/events/${currentEvent.event_id}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentEvent),
    });
    setIsFormOpen(false);
    fetchEvents();
  };

  const handleDeleteClick = async (eventId) => {
    if (window.confirm('Are you sure?')) {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        alert(data.message);
      }
      fetchEvents();
    }
  };

  // --- FUNGSI SCANNER QR ---

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setScanResultMessage({ type: '', text: '' });
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setScanResultMessage({ type: 'error', text: 'Camera access denied.' });
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsScanning(false);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current.getContext('2d');
      canvasRef.current.height = videoRef.current.videoHeight;
      canvasRef.current.width = videoRef.current.videoWidth;
      canvas.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvas.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) handleScanResult(code.data);
      else requestRef.current = requestAnimationFrame(tick);
    } else {
      requestRef.current = requestAnimationFrame(tick);
    }
  };

  const handleScanResult = async (qrCodeData) => {
    stopScanner();
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setScanResultMessage({ type: 'success', text: data.message });
    } catch (err) {
      setScanResultMessage({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    return () => stopScanner(); // Cleanup camera on component unmount
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Admin Dashboard</h2>
      
      {/* --- BAGIAN SCANNER QR --- */}
      <div className="form-container" style={{ marginBottom: '2rem' }}>
        <h3>QR Code Check-in</h3>
        {!isScanning ? (
          <button className="btn" onClick={startScanner}>Start Scanner</button>
        ) : (
          <button className="btn" onClick={stopScanner}>Stop Scanner</button>
        )}
        {isScanning && (
          <div style={{ marginTop: '20px' }}>
            <video ref={videoRef} style={{ width: '100%', maxWidth: '400px' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
        {scanResultMessage.text && (
          <p style={{ color: scanResultMessage.type === 'error' ? 'red' : 'green', marginTop: '1rem' }}>
            <strong>{scanResultMessage.text}</strong>
          </p>
        )}
      </div>

      {/* --- BAGIAN MANAJEMEN ACARA --- */}
      <div className="event-management-section">
        <h3>Event Management</h3>
        <button className="btn" onClick={handleAddClick} style={{ marginBottom: '1rem' }}>
          Add New Event
        </button>

        {isFormOpen && (
          <div className="form-container" style={{ marginBottom: '2rem' }}>
            <h4>{isEditing ? 'Edit Event' : 'Add New Event'}</h4>
            <form onSubmit={handleSubmit}>
              {/* Form inputs... */}
              <input name="title" value={currentEvent.title} onChange={handleInputChange} placeholder="Event Title" required />
              <input name="organizer" value={currentEvent.organizer} onChange={handleInputChange} placeholder="Organizer" required />
              <input name="points" type="number" value={currentEvent.points} onChange={handleInputChange} placeholder="Points" />
              <input name="date" type="date" value={currentEvent.date} onChange={handleInputChange} required />
              <label>
                <input name="is_mandatory" type="checkbox" checked={currentEvent.is_mandatory} onChange={handleInputChange} />
                Is Mandatory
              </label>
              <button type="submit" className="btn">Save Event</button>
              <button type="button" className="btn" onClick={() => setIsFormOpen(false)} style={{ marginLeft: '0.5rem', backgroundColor: '#6c757d' }}>Cancel</button>
            </form>
          </div>
        )}

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.event_id}>
                <td>{event.title}</td>
                <td>{new Date(event.date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleEditClick(event)} style={{ marginRight: '5px' }}>Edit</button>
                  <button onClick={() => handleDeleteClick(event.event_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;