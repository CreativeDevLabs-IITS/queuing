export default function ClientTypeBadge({ clientType }) {
  const styles = {
    REGULAR: { bg: '#e2e8f0', color: '#475569' },
    SENIOR_CITIZEN: { bg: '#fef3c7', color: '#92400e' },
    PWD: { bg: '#dbeafe', color: '#1e40af' },
    PREGNANT: { bg: '#fce7f3', color: '#9f1239' },
  };

  const labels = {
    REGULAR: 'Regular',
    SENIOR_CITIZEN: 'Senior',
    PWD: 'PWD',
    PREGNANT: 'Pregnant',
  };

  const style = styles[clientType] || styles.REGULAR;

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: style.bg,
      color: style.color,
    }}>
      {labels[clientType]}
    </span>
  );
}
