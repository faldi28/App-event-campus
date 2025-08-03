import React from 'react';

function EventList({ events }) {
  return (
    <div className="event-list">
      {events.map(event => (
        <div key={event.id} className="event-card">
          <h3>{event.title}</h3>
          <p><strong>Date:</strong> {event.date} at {event.time}</p>
          <p><strong>Type:</strong> {event.type}</p>
          <p><strong>Points:</strong> {event.points}</p>
          {event.mandatory && <p className="mandatory">Mandatory</p>}
          <p className="organizer">By: {event.organizer}</p>
          <a href={`/event/${event.id}`} className="btn">View & Register</a>
        </div>
      ))}
    </div>
  );
}

export default EventList;