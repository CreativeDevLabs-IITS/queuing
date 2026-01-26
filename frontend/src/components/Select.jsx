export default function Select({ label, error, children, ...props }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#1e293b',
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: error ? '2px solid #ef4444' : '2px solid #e2e8f0',
          fontSize: '16px',
          backgroundColor: 'white',
          cursor: 'pointer',
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#ef4444',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
