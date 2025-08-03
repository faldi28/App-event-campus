import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // CHANGED THIS LINE

function QRCodeDisplay({ registrationId }) {
  return (
    <div className="qr-code-container">
      <h2>Registration Successful!</h2>
      <p>Show this QR code at the event for check-in.</p>
      {/* The QR code is generated based on a unique registration ID */}
      <QRCodeSVG value={registrationId} size={256} /> {/* CHANGED THIS LINE */}
      <p><strong>ID:</strong> {registrationId}</p>
    </div>
  );
}

export default QRCodeDisplay;