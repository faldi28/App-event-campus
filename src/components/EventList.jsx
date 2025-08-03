import React from 'react';

function EventList({ events }) {
  return (
    <div className="event-list">
      {events.map(event => (
        <div key={event.event_id} className="event-card"> {/* FIX: Menggunakan event.event_id */}
          <h3>{event.title}</h3>
          
          {/* FIX: Menggunakan format tanggal yang lebih baik & menghapus event.time */}
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <p><strong>Points:</strong> {event.points}</p>
          
          {/* FIX: Menggunakan event.is_mandatory */}
          {event.is_mandatory && <p className="mandatory">Mandatory</p>}
          
          <p className="organizer">By: {event.organizer}</p>
          
          {/* FIX: Menggunakan event.event_id untuk link */}
          <a href={`/event/${event.event_id}`} className="btn">View & Register</a>
        </div>
      ))}
    </div>
  );
}

export default EventList;