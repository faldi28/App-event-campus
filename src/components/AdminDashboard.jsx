import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

const initialFormState = { title: '', date: '', points: 0, is_mandatory: false, organizer: '' };

function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch events.' });
    }
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
    setMessage({ type: '', text: '' });
  };

  const handleAddClick = () => {
    setCurrentEvent(initialFormState);
    setIsEditing(false);
    setIsFormOpen(true);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `/api/events/${currentEvent.event_id}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentEvent) });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'An error occurred.');
      }
      setMessage({ type: 'success', text: `Event ${isEditing ? 'updated' : 'created'} successfully!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsFormOpen(false);
      fetchEvents();
    }
  };
  
  const handleDeleteClick = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setMessage({ type: 'success', text: data.message });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        fetchEvents();
      }
    }
  };
  
  const handleGenerateCerts = async (eventId) => {
    setMessage({ type: 'info', text: `Generating certificates for event ${eventId}... Please wait.` });
    try {
      const response = await fetch('/api/generate-certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && isScanning) {
      const canvas = canvasRef.current.getContext('2d');
      canvasRef.current.height = videoRef.current.videoHeight;
      canvasRef.current.width = videoRef.current.videoWidth;
      canvas.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvas.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        stopScanner();
        handleScanResult(code.data);
      } else {
        requestRef.current = requestAnimationFrame(tick);
      }
    } else {
      requestRef.current = requestAnimationFrame(tick);
    }
  };

  const handleScanResult = async (qrCodeData) => {
    try {
      setMessage({ type: 'info', text: `QR Code detected: ${qrCodeData}. Verifying...` });
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };
  
  const startScanner = async () => {
    setMessage({ type: '', text: '' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsScanning(true);
          requestRef.current = requestAnimationFrame(tick);
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setMessage({ type: 'error', text: 'Camera access denied or not available.' });
      setIsScanning(false);
    }
  };
  
  const stopScanner = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };
  
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Admin Dashboard</h2>
      
      {message.text && (
        <p style={{ 
          padding: '10px', 
          borderRadius: '5px',
          color: 'white',
          textAlign: 'center',
          backgroundColor: message.type === 'error' ? '#d9534f' : (message.type === 'success' ? '#5cb85c' : '#5bc0de') 
        }}>
          <strong>{message.text}</strong>
        </p>
      )}

      <div className="form-container" style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>QR Code Check-in</h3>
        {!isScanning ? (
          <button className="btn" onClick={startScanner}>Start Scanner</button>
        ) : (
          <button className="btn" onClick={stopScanner}>Stop Scanner</button>
        )}
        <div style={{ marginTop: '20px', display: isScanning ? 'block' : 'none' }}>
          <video ref={videoRef} style={{ width: '100%', maxWidth: '400px', border: '1px solid #ddd' }} playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>

      <div className="event-management-section">
        <h3>Event Management</h3>
        {!isFormOpen && (
          <button className="btn" onClick={handleAddClick} style={{ marginBottom: '1rem' }}>
            Add New Event
          </button>
        )}

        {isFormOpen && (
          <div className="form-container" style={{ marginBottom: '2rem' }}>
            <h4>{isEditing ? 'Edit Event' : 'Add New Event'}</h4>
            <form onSubmit={handleSubmit}>
              <input name="title" value={currentEvent.title} onChange={handleInputChange} placeholder="Event Title" required />
              <input name="organizer" value={currentEvent.organizer} onChange={handleInputChange} placeholder="Organizer" required />
              <input name="points" type="number" value={currentEvent.points} onChange={handleInputChange} placeholder="Points" />
              <input name="date" type="date" value={currentEvent.date} onChange={handleInputChange} required />
              <label><input name="is_mandatory" type="checkbox" checked={currentEvent.is_mandatory} onChange={handleInputChange} /> Is Mandatory</label>
              <button type="submit" className="btn">Save</button>
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
                <td style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  <button onClick={() => handleEditClick(event)}>Edit</button>
                  <button onClick={() => handleDeleteClick(event.event_id)}>Delete</button>
                  <button onClick={() => handleGenerateCerts(event.event_id)}>Certificates</button>
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