import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function VerifyCertificate() {
  const { certificateId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (certificateId) {
      const verify = async () => {
        const response = await fetch(`/api/verify?id=${certificateId}`);
        if (response.ok) {
          const data = await response.json();
          setVerificationData(data);
        } else {
          setVerificationData({ valid: false });
        }
        setLoading(false);
      };
      verify();
    }
  }, [certificateId]);

  if (loading) return <div>Verifying...</div>;

  return (
    <div className="dashboard-container">
      <h2>Certificate Verification</h2>
      {verificationData?.valid ? (
        <div>
          <p style={{color: 'green', fontWeight: 'bold'}}>✅ Certificate is Valid</p>
          <p><strong>Name:</strong> {verificationData.name}</p>
          <p><strong>Event:</strong> {verificationData.title}</p>
          <p><strong>Date:</strong> {new Date(verificationData.date).toLocaleDateString()}</p>
          <p><strong>Certificate ID:</strong> {certificateId}</p>
        </div>
      ) : (
        <p style={{color: 'red', fontWeight: 'bold'}}>❌ Invalid Certificate ID.</p>
      )}
    </div>
  );
}

export default VerifyCertificate;