import React, { useState, useEffect } from 'react';

function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Mengambil data pengguna dari localStorage yang diset saat login
    const user = JSON.parse(localStorage.getItem('user'));
    const userEmail = user?.email;

    // Jika tidak ada email (belum login), tampilkan pesan error
    if (!userEmail) {
      setError('User not logged in. Please login first.');
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
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
    return <div className="dashboard-container" style={{ color: 'red' }}>Error: {error}</div>;
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