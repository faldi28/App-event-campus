import React, { useState, useEffect } from 'react';

// State awal untuk form
const initialFormState = { title: '', date: '', points: 0, is_mandatory: false, organizer: '' };

function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  // Fungsi untuk mengambil data acara
  const fetchEvents = async () => {
    const response = await fetch('/api/events');
    const data = await response.json();
    setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handler untuk perubahan pada input form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentEvent({
      ...currentEvent,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handler untuk membuka form edit
  const handleEditClick = (event) => {
    // Format tanggal YYYY-MM-DD untuk input type="date"
    const formattedEvent = { ...event, date: new Date(event.date).toISOString().split('T')[0] };
    setCurrentEvent(formattedEvent);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  // Handler untuk membuka form tambah baru
  const handleAddClick = () => {
    setCurrentEvent(initialFormState);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  // Handler untuk submit form (Create & Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing ? `/api/events/${currentEvent.event_id}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';

    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentEvent),
    });

    setIsFormOpen(false);
    fetchEvents(); // Ambil ulang data terbaru
  };
  
  // Handler untuk menghapus acara
  const handleDeleteClick = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const response = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message); // Tampilkan pesan error jika tidak bisa dihapus
      }
      fetchEvents(); // Ambil ulang data terbaru
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Admin Dashboard - Event Management</h2>
      
      <button className="btn" onClick={handleAddClick} style={{ marginBottom: '1rem' }}>
        Add New Event
      </button>

      {/* Form untuk Add/Edit Event */}
      {isFormOpen && (
        <div className="form-container" style={{ marginBottom: '2rem' }}>
          <h3>{isEditing ? 'Edit Event' : 'Add New Event'}</h3>
          <form onSubmit={handleSubmit}>
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

      {/* Tabel Daftar Acara */}
      <h3>Event List</h3>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Organizer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.event_id}>
              <td>{event.title}</td>
              <td>{new Date(event.date).toLocaleDateString()}</td>
              <td>{event.organizer}</td>
              <td>
                <button onClick={() => handleEditClick(event)} style={{ marginRight: '5px' }}>Edit</button>
                <button onClick={() => handleDeleteClick(event.event_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;