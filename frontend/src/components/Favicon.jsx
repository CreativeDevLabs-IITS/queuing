import { useEffect } from 'react';
import api from '../utils/api';

export default function Favicon() {
  useEffect(() => {
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }

    const setFavicon = (url) => {
      const fullUrl = url && !url.startsWith('http') && !url.startsWith('data:')
        ? (url.startsWith('/') ? window.location.origin + url : window.location.origin + '/' + url)
        : url;
      faviconLink.href = fullUrl;
    };

    const defaultFavicon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23667eea' rx='12'/%3E%3Ctext x='50' y='68' font-size='60' font-weight='bold' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='system-ui,sans-serif'%3EQ%3C/text%3E%3C/svg%3E";

    const loadLogo = async () => {
      try {
        const res = await api.get('/admin/settings/logo');
        if (res.data?.logoUrl) {
          setFavicon(res.data.logoUrl);
        } else {
          setFavicon(defaultFavicon);
        }
      } catch {
        setFavicon(defaultFavicon);
      }
    };

    loadLogo();
    const interval = setInterval(loadLogo, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
