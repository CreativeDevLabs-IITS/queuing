import { useState, useEffect } from 'react';
import api from '../utils/api';

const QUEUING_SYSTEM_LABEL = 'Queuing System';

export default function Logo({
  size = 'medium',
  showText = true,
  showTitle = true,
  titlePosition = 'next',
  align = 'left',
  gap = '12px',
  variant = 'default',
}) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [siteTitle, setSiteTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadLogo();
    const interval = setInterval(loadLogo, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showTitle) return;
    loadSiteTitle();
    const interval = setInterval(loadSiteTitle, 30000);
    return () => clearInterval(interval);
  }, [showTitle]);

  const loadLogo = async () => {
    try {
      const res = await api.get('/admin/settings/logo');
      if (res.data.logoUrl) {
        let url = res.data.logoUrl;
        if (url && !url.startsWith('http') && !url.startsWith('/')) {
          url = '/' + url;
        }
        const separator = url.includes('?') ? '&' : '?';
        url = url + separator + '_t=' + Date.now();
        setLogoUrl(url);
        setImageError(false);
      } else {
        setLogoUrl(null);
        setImageError(false);
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSiteTitle = async () => {
    try {
      const res = await api.get('/admin/settings/site-title');
      setSiteTitle(res.data.siteTitle || null);
    } catch (error) {
      console.error('Failed to load site title:', error);
      setSiteTitle(null);
    }
  };

  const sizes = {
    small: { width: '80px', height: '40px' },
    medium: { width: '120px', height: '60px' },
    large: { width: '180px', height: '90px' },
    monitor: { width: '88px', height: '80px' },
  };

  const sizeStyle = sizes[size] || sizes.medium;
  const titleFontSize =
    size === 'small' ? '18px' : size === 'large' ? '28px' : size === 'monitor' ? '18px' : '24px';
  const subtitleFontSize =
    size === 'small' ? '14px' : size === 'large' ? '20px' : size === 'monitor' ? '14px' : '16px';
  const isMonitor = variant === 'monitor';
  const titleStyle = {
    fontSize: titleFontSize,
    fontWeight: '700',
    color: isMonitor ? '#e5e7eb' : '#1e293b',
    ...(isMonitor && { textShadow: '0 2px 4px rgba(0,0,0,0.6)' }),
  };
  const subtitleStyle = {
    fontSize: subtitleFontSize,
    fontWeight: '600',
    color: isMonitor ? '#e5e7eb' : '#64748b',
    textTransform: 'uppercase',
    ...(isMonitor && { textShadow: '0 2px 4px rgba(0,0,0,0.6)' }),
  };
  const isCenter = align === 'center';

  if (loading) {
    return null;
  }

  const logoEl = (
    <>
      {logoUrl && !imageError ? (
        <img
          src={logoUrl}
          alt="Logo"
          style={{
            ...sizeStyle,
            objectFit: 'contain',
            maxWidth: '100%',
          }}
          onError={() => {
            setImageError(true);
            setLogoUrl(null);
          }}
        />
      ) : (
        <div
          style={{
            ...sizeStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '700',
            fontSize: size === 'small' ? '14px' : size === 'large' ? '24px' : '18px',
          }}
        >
          Q
        </div>
      )}
    </>
  );

  // Title block: optional site title on first line, "Queuing System" on next line (when showTitle)
  const titleBlock =
    showTitle ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          alignItems: isCenter ? 'center' : 'flex-start',
          textAlign: isCenter ? 'center' : 'left',
        }}
      >
        {siteTitle && <span style={titleStyle}>{siteTitle}</span>}
        <span style={subtitleStyle}>{QUEUING_SYSTEM_LABEL}</span>
      </div>
    ) : null;

  if (titlePosition === 'below' && (logoEl || titleBlock)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCenter ? 'center' : 'flex-start',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCenter ? 'center' : undefined, gap }}>
          {logoEl}
        </div>
        {titleBlock}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
        flexDirection: 'row',
      }}
    >
      {logoEl}
      {titleBlock}
    </div>
  );
}
