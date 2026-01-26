import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import WindowCard from '../components/WindowCard';
import Loading from '../components/Loading';
import Logo from '../components/Logo';

export default function PublicMonitoring() {
  const [windows, setWindows] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (videos.length > 0 && !currentVideo) {
      setCurrentVideo(videos[0]);
    }
  }, [videos, currentVideo]);

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      const video = videoRef.current;
      
      const handleEnded = () => {
        // Find next video or loop back
        const currentIndex = videos.findIndex(v => v.url === currentVideo.url);
        const nextIndex = (currentIndex + 1) % videos.length;
        setCurrentVideo(videos[nextIndex]);
      };

      video.addEventListener('ended', handleEnded);
      video.load();
      
      // Try to autoplay with sound, fallback to muted autoplay
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Autoplay started successfully, try to unmute
            video.muted = false;
          })
          .catch(() => {
            // Autoplay was prevented, play muted instead
            video.muted = true;
            video.play().catch(console.error);
          });
      }

      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentVideo, videos]);

  const loadData = async () => {
    try {
      const res = await api.get('/queue/public/windows');
      setWindows(res.data.windows);
    } catch (error) {
      console.error('Failed to load windows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const res = await api.get('/videos');
      setVideos(res.data.videos || []);
      setVideoError(false);
    } catch (error) {
      console.error('Failed to load videos:', error);
      setVideoError(true);
      setVideos([]);
    }
  };

  const handleVideoSelect = (video) => {
    setCurrentVideo(video);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
    }}>
      {/* Top Section - Windows */}
      <div style={{
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Navbar with Logo and Title */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '8px 0',
        }}>
          <Logo size="large" />
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
          }}>
            Queue Monitoring
          </h1>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px',
            maxWidth: '900px',
            margin: '0 auto 24px',
          }}
          className="grid-responsive">
            {windows.length > 0 ? (
              windows.map((window) => (
                <WindowCard key={window.id} window={window} />
              ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px',
                background: 'white',
                borderRadius: '12px',
                color: '#64748b',
              }}>
                No active windows at the moment
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section - Video Player */}
      <div style={{
        background: '#1e293b',
        padding: 0,
        width: '100%',
        minHeight: '50vh',
      }}>
        {videos.length > 0 && !videoError ? (
          <div style={{
            width: '100%',
            height: '100%',
            minHeight: '50vh',
            position: 'relative',
            background: '#000',
          }}>
            <video
              ref={videoRef}
              src={currentVideo?.url}
              controls
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                minHeight: '50vh',
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div style={{
            width: '100%',
            minHeight: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 40px',
            textAlign: 'center',
          }}>
            <div style={{
              color: '#94a3b8',
              fontSize: '18px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              No video playlist set yet
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '14px',
            }}>
              Please configure the video folder path in the admin settings
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
