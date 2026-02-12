import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import WindowCard from '../components/WindowCard';
import Loading from '../components/Loading';
import Logo from '../components/Logo';
import { getQueueCounter } from '../utils/queueNumber';

export default function PublicMonitoring() {
  const [windows, setWindows] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const previousWindowsRef = useRef([]);
  const hasAnnouncedOnceRef = useRef(false);
  const announcementQueueRef = useRef([]);
  const isProcessingAnnouncementRef = useRef(false);
  const lastAnnouncedKeyRef = useRef(null);
  const lastAnnouncedTimeRef = useRef(0);
  const COLLISION_WINDOW_MS = 8000;
  const [dingSoundUrl, setDingSoundUrl] = useState(null);
  const dingSoundUrlRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    loadData();
    loadDingSound();
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
      video.volume = 1.0;
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
      const newWindows = res.data.windows || [];

      // Defer TTS to next tick to avoid blocking main thread (can cause browser freeze)
      const prev = previousWindowsRef.current;
      setWindows(newWindows);
      previousWindowsRef.current = newWindows;

      setTimeout(() => {
        try {
          handleNowServingAnnouncements(prev, newWindows);
        } catch (announceError) {
          console.error('Failed to run TTS announcements:', announceError);
        }
      }, 0);
    } catch (error) {
      console.error('Failed to load windows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDingSound = async () => {
    try {
      const res = await api.get('/admin/settings/ding-sound');
      const url = res.data.dingSoundUrl || null;
      setDingSoundUrl(url);
      dingSoundUrlRef.current = url;
    } catch (error) {
      console.error('Failed to load ding sound URL:', error);
      setDingSoundUrl(null);
      dingSoundUrlRef.current = null;
    }
  };


  const playDing = (onDone) => {
    // Safety: max wait before TTS, even if audio events fail
    const MAX_WAIT_MS = 7000;

    if (typeof window === 'undefined') {
      console.log('playDing: window undefined');
      if (onDone) setTimeout(onDone, MAX_WAIT_MS);
      return;
    }

    console.log('playDing: starting');
    let done = false;
    let ultimateTimeoutId = null;
    
    // Ultimate safety: ensure safeDone is called within MAX_WAIT_MS no matter what
    ultimateTimeoutId = setTimeout(() => {
      if (!done) {
        console.warn('playDing: Ultimate timeout reached, forcing safeDone');
        done = true;
        if (onDone) {
          try {
            onDone();
          } catch (err) {
            console.error('playDing: Error in onDone callback:', err);
          }
        }
      }
    }, MAX_WAIT_MS);
    
    const safeDone = () => {
      if (done) {
        console.log('playDing: safeDone called but already done');
        return;
      }
      done = true;
      if (ultimateTimeoutId) {
        clearTimeout(ultimateTimeoutId);
        ultimateTimeoutId = null;
      }
      console.log('playDing: done - calling onDone callback');
      if (onDone) {
        try {
          onDone();
        } catch (err) {
          console.error('playDing: Error in onDone callback:', err);
        }
      } else {
        console.warn('playDing: No onDone callback provided');
      }
    };

    try {
      // Prefer the uploaded MP3 ding if configured (use ref so we always have latest URL)
      const dingUrl = dingSoundUrlRef.current || dingSoundUrl;
      if (dingUrl && typeof dingUrl === 'string') {
        const url = dingUrl.startsWith('http') ? dingUrl : `${window.location.origin}${dingUrl.startsWith('/') ? '' : '/'}${dingUrl}`;
        console.log('playDing: Using custom ding sound:', url);
        const audio = new Audio(url);
        audio.volume = 1.0;
        let customDingPlayed = false;

        const tryFallbackChime = () => {
          if (done) return;
          console.log('playDing: Trying synthesized chime fallback');
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) {
            console.warn('playDing: No AudioContext available');
            safeDone();
            return;
          }
          
          let ctx = audioContextRef.current;
          if (!ctx) {
            try {
              ctx = new AudioCtx();
              // Check if context is usable
              if (ctx.state === 'suspended') {
                // Context created but suspended - will need resume
                audioContextRef.current = ctx;
              } else {
                audioContextRef.current = ctx;
              }
            } catch (createErr) {
              console.warn('playDing: Cannot create AudioContext (needs user gesture):', createErr);
              // Still call safeDone so TTS can proceed
              if (!done) safeDone();
              return;
            }
          }
          
          // If we still don't have a context, give up
          if (!ctx) {
            console.warn('playDing: No AudioContext available');
            if (!done) safeDone();
            return;
          }
          
          const playChime = () => {
            if (done) return;
            try {
              console.log('playDing: Playing synthesized chime');
              const osc1 = ctx.createOscillator();
              const osc2 = ctx.createOscillator();
              const gain = ctx.createGain();

              osc1.type = 'sine';
              osc2.type = 'sine';

              const now = ctx.currentTime;
              osc1.frequency.setValueAtTime(880, now);
              osc2.frequency.setValueAtTime(1175, now + 0.08);

              osc1.connect(gain);
              osc2.connect(gain);
              gain.connect(ctx.destination);

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

              osc1.start(now);
              osc2.start(now + 0.08);
              osc1.stop(now + 0.4);
              osc2.stop(now + 0.4);

              setTimeout(() => {
                if (!done) {
                  console.log('playDing: Synthesized chime finished');
                  safeDone();
                }
              }, 500);
            } catch (chimeErr) {
              console.error('playDing: Failed to play chime:', chimeErr);
              if (!done) safeDone();
            }
          };
          
          if (ctx.state === 'suspended' && ctx.resume) {
            ctx.resume().then(() => {
              if (!done) playChime();
            }).catch((resumeErr) => {
              console.warn('playDing: AudioContext resume failed:', resumeErr);
              if (!done) safeDone();
            });
          } else {
            playChime();
          }
        };

        const handleEnded = () => {
          if (done) return;
          console.log('playDing: Audio ended event fired, currentTime:', audio.currentTime, 'duration:', audio.duration);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          audio.removeEventListener('canplaythrough', handleCanPlay);
          audio.removeEventListener('loadeddata', handleCanPlay);
          
          // Check if audio actually played
          const playedEnough = audio.currentTime >= Math.min(0.1, audio.duration * 0.1);
          if (playedEnough || audio.duration === 0) {
            console.log('playDing: Custom ding played successfully');
            customDingPlayed = true;
            safeDone();
          } else {
            console.warn('playDing: Custom ding ended immediately, trying fallback chime');
            tryFallbackChime();
          }
        };

        const handleError = (err) => {
          console.error('Failed to play custom ding sound:', err);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
          audio.removeEventListener('canplaythrough', handleCanPlay);
          audio.removeEventListener('loadeddata', handleCanPlay);
          tryFallbackChime();
        };

        const attemptPlay = () => {
          console.log('playDing: Audio ready, attempting to play, readyState:', audio.readyState, 'duration:', audio.duration, 'currentTime:', audio.currentTime);
          // Reset to beginning in case audio was previously played
          audio.currentTime = 0;
          
          // Small delay to ensure currentTime reset takes effect
          setTimeout(() => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log('playDing: Audio playing successfully, paused:', audio.paused, 'currentTime:', audio.currentTime, 'duration:', audio.duration);
                // Verify audio is actually playing
                setTimeout(() => {
                  if (audio.paused && !done && !customDingPlayed) {
                    console.warn('playDing: Audio paused after play() promise resolved, may be blocked by autoplay policy. Will try fallback chime.');
                    handleError(new Error('Autoplay blocked'));
                  } else if (!audio.paused) {
                    console.log('playDing: Audio confirmed playing, currentTime:', audio.currentTime);
                  }
                }, 100);
              }).catch((err) => {
                console.error('Failed to start custom ding sound:', err);
                handleError(err);
              });
            } else {
              console.warn('playDing: play() returned undefined');
              setTimeout(() => {
                if (audio.paused && !done && !customDingPlayed) {
                  console.warn('playDing: Audio is paused after play(), treating as error. Will try fallback chime.');
                  handleError(new Error('Audio did not start playing'));
                }
              }, 100);
            }
          }, 10);
        };

        const handleCanPlay = () => {
          audio.removeEventListener('canplaythrough', handleCanPlay);
          audio.removeEventListener('loadeddata', handleCanPlay);
          attemptPlay();
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        
        // Check if already ready, otherwise wait for load
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          console.log('playDing: Audio already loaded, playing immediately');
          attemptPlay();
        } else {
          audio.addEventListener('canplaythrough', handleCanPlay);
          audio.addEventListener('loadeddata', handleCanPlay);
          audio.load();
        }

        // Hard safety timeout - if custom ding didn't play, try fallback chime
        setTimeout(() => {
          if (!done && !customDingPlayed) {
            console.warn('playDing: Custom ding timeout (2s), trying fallback chime');
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('loadeddata', handleCanPlay);
            tryFallbackChime();
          }
        }, 2000);
        
        return; // Return here - handlers will call tryFallbackChime or safeDone
      }

      // Fallback: synthesized chime (use context unlocked by user gesture if available)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = audioContextRef.current || new AudioCtx();
        
        // Resume context if suspended - wait for it to resume before playing
        const playChime = () => {
          console.log('playDing: Playing synthesized chime');
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';

          const now = ctx.currentTime;
          osc1.frequency.setValueAtTime(880, now); // A5
          osc2.frequency.setValueAtTime(1175, now + 0.08); // ~D6

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

          osc1.start(now);
          osc2.start(now + 0.08);
          osc1.stop(now + 0.4);
          osc2.stop(now + 0.4);

          // Synth chime is ~0.4s; call done shortly after
          setTimeout(() => {
            console.log('playDing: Synthesized chime finished');
            safeDone();
          }, 500);
        };
        
        if (ctx.state === 'suspended' && ctx.resume) {
          ctx.resume().then(() => {
            playChime();
          }).catch(() => {
            // If resume fails, try playing anyway
            playChime();
          });
        } else {
          playChime();
        }
        return;
      }
      
      // If we get here, tryFallbackChime was called but AudioContext not available
      console.warn('playDing: No AudioContext available, cannot play chime');
      safeDone();
    } catch (err) {
      console.error('Failed to play ding sound:', err);
    }

    // Last resort if nothing above worked
    setTimeout(safeDone, MAX_WAIT_MS);
  };

  const duckVideoVolume = (volume) => {
    const vid = videoRef.current;
    if (vid) vid.volume = Math.max(0, Math.min(1, volume));
  };

  const fallbackSpeech = (text, resolve) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    } else {
      resolve();
    }
  };

  const playTTSAndWait = (text) => {
    return new Promise((resolve) => {
      if (!text || typeof text !== 'string' || !text.trim()) {
        console.warn('TTS: Empty or invalid text provided');
        resolve();
        return;
      }
      
      api.post('/tts', { text }, { responseType: 'arraybuffer' })
        .then((response) => {
          const contentType = (response.headers && response.headers['content-type']) || '';
          const isAudio = contentType.includes('audio/') || contentType.includes('mpeg');
          if (response.status !== 200 || !isAudio || !response.data) {
            console.warn('TTS: Invalid response, falling back to speechSynthesis');
            fallbackSpeech(text, resolve);
            return;
          }
          const audioData = response.data;
          const blob = new Blob([audioData], { type: 'audio/mpeg' });
          const ttsUrl = URL.createObjectURL(blob);
          const audio = new Audio(ttsUrl);
          audio.volume = 1.0;

          const cleanup = () => {
            // Clear audio source first to stop any pending loads
            audio.src = '';
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            // Small delay before revoking to ensure audio element has released the URL
            setTimeout(() => URL.revokeObjectURL(ttsUrl), 100);
          };

          const handleEnded = () => {
            cleanup();
            resolve();
          };

          const handleError = (err) => {
            console.error('TTS audio playback error:', err);
            cleanup();
            fallbackSpeech(text, resolve);
          };

          audio.addEventListener('ended', handleEnded);
          audio.addEventListener('error', handleError);
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.error('TTS audio play() failed:', err);
              cleanup();
              fallbackSpeech(text, resolve);
            });
          }
        })
        .catch((err) => {
          console.error('TTS API call failed:', err);
          fallbackSpeech(text, resolve);
        });
    });
  };

  const playDingAsync = () => {
    return new Promise((resolve) => playDing(resolve));
  };

  const processNextAnnouncement = async () => {
    if (isProcessingAnnouncementRef.current) {
      console.log('Already processing announcement, skipping');
      return;
    }
    if (announcementQueueRef.current.length === 0) {
      console.log('No announcements in queue');
      return;
    }
    
    console.log(`Processing announcement, queue length: ${announcementQueueRef.current.length}`);
    isProcessingAnnouncementRef.current = true;
    const item = announcementQueueRef.current.shift();
    if (!item) {
      console.log('No item to process');
      isProcessingAnnouncementRef.current = false;
      if (announcementQueueRef.current.length > 0) processNextAnnouncement();
      return;
    }
    const { text } = item;
    console.log('Starting announcement:', text);
    try {
      duckVideoVolume(0.5);
      console.log('Playing ding...');
      await playDingAsync();
      console.log('Ding finished, playing TTS...');
      await playTTSAndWait(text);
      console.log('TTS finished');
      markAnnouncementDone(item.key);
    } catch (err) {
      console.error('Announcement playback error:', err);
    } finally {
      duckVideoVolume(1.0);
      isProcessingAnnouncementRef.current = false;
      if (announcementQueueRef.current.length > 0) {
        processNextAnnouncement();
      }
    }
  };

  const handleNowServingAnnouncements = (oldWindows, newWindows) => {
    if (typeof window === 'undefined') return;

    if (!hasAnnouncedOnceRef.current) {
      hasAnnouncedOnceRef.current = true;
      return;
    }

    const oldMap = new Map();
    (oldWindows || []).forEach((w) => {
      if (w && w.id && w.currentServing) {
        oldMap.set(w.id, w.currentServing.queueNumber);
      }
    });

    const now = Date.now();
    const queueSet = new Set(announcementQueueRef.current.map((i) => i.key).filter(Boolean));
    const toAnnounce = [];
    (newWindows || []).forEach((w) => {
      if (!w || !w.id || !w.currentServing) return;
      const newQueueNumber = w.currentServing.queueNumber;
      const clientName = w.currentServing.clientName;
      const oldQueueNumber = oldMap.get(w.id);
      if (!newQueueNumber || newQueueNumber === oldQueueNumber) return;

      const key = `${w.id}:${newQueueNumber}`;
      if (queueSet.has(key)) return;
      if (lastAnnouncedKeyRef.current === key && now - lastAnnouncedTimeRef.current < COLLISION_WINDOW_MS) return;
      queueSet.add(key);

      const rawCounter = getQueueCounter ? getQueueCounter(newQueueNumber) : newQueueNumber;
      let spokenCounter = rawCounter;
      const parsed = parseInt(rawCounter, 10);
      if (!Number.isNaN(parsed)) spokenCounter = String(parsed);

      const windowLabel = w.label || 'Window';
      const clientNamePart = clientName ? `, ${clientName}` : '';
      // Hardcoded Cebuano announcement template
      const template = 'Ang atong {{window}},... mu assist na sa kyu number, {{queueNumber}}. {{clientNamePart}}, please proceed to {{window}}.';
      const text = template
        .replace(/{{\s*window\s*}}/gi, windowLabel)
        .replace(/{{\s*queueNumber\s*}}/gi, spokenCounter)
        .replace(/{{\s*clientNamePart\s*}}/gi, clientNamePart);

      console.log('Announcement queued:', { windowLabel, spokenCounter, text });
      toAnnounce.push({ text, key });
    });

    if (toAnnounce.length > 0) {
      console.log(`Adding ${toAnnounce.length} announcement(s) to queue`);
      toAnnounce.forEach((item) => announcementQueueRef.current.push(item));
      processNextAnnouncement();
    }
  };

  const markAnnouncementDone = (key) => {
    if (key) {
      lastAnnouncedKeyRef.current = key;
      lastAnnouncedTimeRef.current = Date.now();
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

  const unlockAudio = () => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx && !audioContextRef.current) {
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        if (ctx.resume) ctx.resume();
      }
    } catch (_) {}
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        overflow: 'hidden',
      }}
      onClick={unlockAudio}
      onTouchStart={unlockAudio}
      role="presentation"
    >
      {/* Top half: header + cards (scrollable if needed) */}
      <div style={{
        flex: '0 0 50vh',
        minHeight: 0,
        overflowY: 'auto',
      }}>
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
              marginBottom: '24px',
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
      </div>

      {/* Bottom half: video player (stuck at bottom, exactly 50vh) */}
      <div style={{
        flex: '0 0 50vh',
        minHeight: 0,
        background: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {videos.length > 0 && !videoError ? (
          <div style={{
            flex: 1,
            minHeight: 0,
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
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div style={{
            flex: 1,
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
