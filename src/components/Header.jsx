import React from 'react';

function Header() {
  return (
    <header className="header">
      <h1>Campus Event System</h1>
      <nav className="nav">
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/admin">Admin</a>
      </nav>
    </header>
  );
}

export default Header;