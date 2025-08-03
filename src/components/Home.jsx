import React, { useState, useEffect } from 'react';
import EventList from './EventList';

function Home() {
  // Siapkan state untuk menampung data acara dan status loading
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gunakan useEffect untuk mengambil data saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Panggil API endpoint yang sudah kita buat
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data); // Simpan data dari API ke dalam state
      } catch (error) {
        console.error("Gagal mengambil data acara:", error);
      } finally {
        setLoading(false); // Hentikan status loading
      }
    };

    fetchEvents();
  }, []); // Array kosong memastikan useEffect hanya berjalan sekali

  // Tampilkan pesan loading jika data belum siap
  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div>
      <h2>Upcoming Events</h2>
      <EventList events={events} />
    </div>
  );
}

export default Home;