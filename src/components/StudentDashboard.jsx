import React, { useState, useEffect } from 'react';

function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      // --- CATATAN PENTING ---
      // Di aplikasi nyata, email ini akan didapat dari sesi login.
      // Untuk proyek ini, kita hardcode satu email untuk simulasi.
      const userEmail = 'budi@example.com'; // Ganti dengan email yang sudah Anda daftarkan ke acara

      try {
        const response = await fetch(`/api/dashboard?email=${userEmail}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch data');
        }

        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!dashboardData) {
    return <div>No data found.</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Student Dashboard</h2>
      <h3>Welcome, {dashboardData.name}!</h3>
      <p><strong>Total Activity Points:</strong> {dashboardData.totalPoints}</p>
      <h4>Your Event History:</h4>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Event Title</th>
            <th>Date</th>
            <th>Points Earned</th>
          </tr>
        </thead>
        <tbody>
          {dashboardData.eventHistory.map((event, index) => (
            <tr key={index}>
              <td>{event.title}</td>
              <td>{new Date(event.date).toLocaleDateString()}</td>
              <td>{event.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentDashboard;