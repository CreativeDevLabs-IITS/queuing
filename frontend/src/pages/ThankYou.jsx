import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQueueEntry, clearQueueEntry } from '../utils/queueStorage';
import Logo from '../components/Logo';

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a valid queue entry
    const queueEntry = getQueueEntry();
    if (!queueEntry || queueEntry.status !== 'SERVED') {
      // If no entry or not served, redirect to home
      navigate('/');
      return;
    }

    // Clear the queue entry after showing thank you page
    // Optionally, you can clear it after a delay or keep it for reference
    const timer = setTimeout(() => {
      clearQueueEntry();
    }, 5000); // Clear after 5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  const queueEntry = getQueueEntry();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <Logo size="medium" />
        </div>
        <div style={{
          fontSize: '64px',
          marginBottom: '24px',
        }}>
          ✅
        </div>
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '16px',
          color: '#1e293b',
        }}>
          Thank You!
        </h1>

        {queueEntry && (
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            marginBottom: '24px',
          }}>
            Thank you, <strong>{queueEntry.clientName}</strong>, for your visit.
          </p>
        )}

        <p style={{
          fontSize: '16px',
          color: '#475569',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          We appreciate your business and look forward to serving you again.
        </p>

        <div style={{
          padding: '20px',
          background: '#f1f5f9',
          borderRadius: '12px',
          marginBottom: '32px',
        }}>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0,
          }}>
            Your service has been completed. Have a wonderful day!
          </p>
        </div>

        <button
          onClick={() => {
            clearQueueEntry();
            navigate('/');
          }}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#1e40af';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#2563eb';
          }}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
