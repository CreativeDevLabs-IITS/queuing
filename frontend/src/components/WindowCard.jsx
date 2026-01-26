import { getQueueCounter } from '../utils/queueNumber';

export default function WindowCard({ window }) {
  const { label, staff, currentServing } = window;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '2px solid #e2e8f0',
      transition: 'all 0.2s',
    }}>
      <div style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '12px',
      }}>
        {label}
      </div>
      
      {staff && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid #e2e8f0',
            background: staff.profilePicture
              ? `url(${staff.profilePicture}) center/cover`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {!staff.profilePicture && getInitials(staff.name)}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#64748b',
          }}>
            {staff.name}
          </div>
        </div>
      )}

      {currentServing ? (
        <div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '4px',
          }}>
            Now Serving:
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#2563eb',
            marginBottom: '8px',
          }}>
            {getQueueCounter(currentServing.queueNumber)}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#64748b',
          }}>
            {currentServing.category.name}
            {currentServing.subCategory && ` - ${currentServing.subCategory.name}`}
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: '14px',
          color: '#94a3b8',
          fontStyle: 'italic',
        }}>
          No active service
        </div>
      )}
    </div>
  );
}
