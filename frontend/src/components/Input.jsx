export default function Input({ label, error, style: styleProp, disabled, ...props }) {
  const baseStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: error ? '2px solid #ef4444' : '2px solid #e2e8f0',
    fontSize: '16px',
    transition: 'border-color 0.2s',
    ...(disabled && {
      background: '#f1f5f9',
      color: '#64748b',
      cursor: 'not-allowed',
    }),
    ...styleProp,
  };
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
      <input
        style={baseStyle}
        disabled={disabled}
        {...props}
      />
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
