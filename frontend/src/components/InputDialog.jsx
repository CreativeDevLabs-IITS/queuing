import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InputDialog({ 
  open, 
  title, 
  message, 
  placeholder = '',
  onConfirm, 
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'text',
  required = true
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue('');
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (required && !value.trim()) return;
    onConfirm(value);
    setValue('');
  };

  const handleCancel = () => {
    setValue('');
    onCancel();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '16px',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: 0,
          }}>
            {title}
          </h3>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {message && (
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            marginBottom: '16px',
            lineHeight: '1.6',
          }}>
            {message}
          </p>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '24px',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleConfirm();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          autoFocus
        />

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              background: 'transparent',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f1f5f9';
              e.target.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={required && !value.trim()}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: (required && !value.trim()) ? '#cbd5e1' : '#2563eb',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (required && !value.trim()) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onMouseOver={(e) => {
              if (!(required && !value.trim())) {
                e.target.style.background = '#1e40af';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (!(required && !value.trim())) {
                e.target.style.background = '#2563eb';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
