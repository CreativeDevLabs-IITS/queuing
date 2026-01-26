import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Logo({ size = 'medium', showText = true }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadLogo();
    // Refresh logo every 30 seconds in case it was updated
    const interval = setInterval(loadLogo, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLogo = async () => {
    try {
      const res = await api.get('/admin/settings/logo');
      if (res.data.logoUrl) {
        // Ensure the URL is properly formatted
        let url = res.data.logoUrl;
        // If it's a relative path, ensure it starts with /
        if (url && !url.startsWith('http') && !url.startsWith('/')) {
          url = '/' + url;
        }
        // Add cache busting parameter to ensure fresh load
        const separator = url.includes('?') ? '&' : '?';
        url = url + separator + '_t=' + Date.now();
        setLogoUrl(url);
        setImageError(false);
      } else {
        setLogoUrl(null);
        setImageError(false);
      }
    } catch (error) {
      // Log error for debugging
      console.error('Failed to load logo:', error);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  const sizes = {
    small: { width: '80px', height: '40px' },
    medium: { width: '120px', height: '60px' },
    large: { width: '180px', height: '90px' },
  };

  const sizeStyle = sizes[size] || sizes.medium;

  if (loading) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      {logoUrl && !imageError ? (
        <img
          src={logoUrl}
          alt="Logo"
          style={{
            ...sizeStyle,
            objectFit: 'contain',
            maxWidth: '100%',
          }}
          onError={(e) => {
            console.error('Failed to load logo image:', logoUrl);
            setImageError(true);
            setLogoUrl(null);
          }}
        />
      ) : (
        <div style={{
          ...sizeStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '700',
          fontSize: size === 'small' ? '14px' : size === 'large' ? '24px' : '18px',
        }}>
          Q
        </div>
      )}
      {showText && (
        <span style={{
          fontSize: size === 'small' ? '18px' : size === 'large' ? '28px' : '24px',
          fontWeight: '700',
          color: '#1e293b',
        }}>
        </span>
      )}
    </div>
  );
}
