import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';

function AdminDashboard() {
  // FIX: Menambahkan semua state dan ref yang dibutuhkan untuk scanner
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  // State untuk daftar acara dan pesan
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch daftar acara saat komponen dimuat
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setMessage({ type: 'error', text: 'Could not load event list.' });
      }
    };
    fetchEvents();
  }, []);

  // Fungsi untuk generate sertifikat
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

  // --- LOGIKA SCANNER ---

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setMessage({ type: '', text: '' });
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage({ type: 'error', text: 'Camera access denied or not available.' });
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    setIsScanning(false);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current.getContext('2d');
      canvasRef.current.height = videoRef.current.videoHeight;
      // FIX: Mengubah 'video_ref' menjadi 'videoRef'
      canvasRef.current.width = videoRef.current.videoWidth;
      canvas.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvas.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleScanResult(code.data);
      } else if (requestRef.current) {
        requestRef.current = requestAnimationFrame(tick);
      }
    } else if (requestRef.current) {
      requestRef.current = requestAnimationFrame(tick);
    }
  };

  const handleScanResult = async (qrCodeData) => {
    stopScanner();
    setScanResult(qrCodeData);
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeData }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  useEffect(() => {
    // Cleanup effect untuk memastikan kamera mati saat komponen di-unmount
    return () => stopScanner();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Admin Dashboard</h2>

      {/* Bagian untuk Scanner QR */}
      <div className="scanner-section">
          <h3>QR Code Check-in</h3>
          {!isScanning ? (
            <button className="btn" onClick={startScanner}>Start Scanner</button>
          ) : (
            <button className="btn" onClick={stopScanner}>Stop Scanner</button>
          )}

          {isScanning && (
            <div style={{ marginTop: '20px', position: 'relative' }}>
              <video ref={videoRef} style={{ width: '100%', maxWidth: '400px', border: '1px solid #ddd' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}
      </div>
      
      {/* Bagian untuk mengelola event */}
      <div className="manage-events-section">
        <h3 style={{ marginTop: '2rem' }}>Manage Events</h3>
        {message.text && <p style={{ color: message.type === 'error' ? 'red' : (message.type === 'success' ? 'green' : 'black') }}><strong>{message.text}</strong></p>}
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.event_id}>
                <td>{event.title}</td>
                <td>
                  <button className="btn" onClick={() => handleGenerateCerts(event.event_id)}>
                    Generate Certificates
                  </button>
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