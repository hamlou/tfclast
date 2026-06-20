import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Settings, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// YouTube IFrame Player Component
const YouTubePlayer = ({ url, playing, volume, playbackRate, onReady, onStateChange, onError, onProgress, onMetadataLoaded }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const progressIntervalRef = useRef(null);

  // Extract video ID from URL
  const getVideoId = (videoUrl) => {
    if (!videoUrl) return null;
    
    // Handle youtu.be format (short URL)
    const shortMatch = videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      return shortMatch[1];
    }
    
    // Handle youtube.com/watch?v= format
    const watchMatch = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      return watchMatch[1];
    }
    
    // Handle youtube.com/embed/ format
    const embedMatch = videoUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }
    
    return null;
  };

  const videoId = getVideoId(url);

  useEffect(() => {
    if (!videoId) {
      console.error('❌ No valid video ID extracted from URL:', url);
      return;
    }

    let isMounted = true; // Track if component is still mounted

    // Check if YouTube API is already loaded
    const loadYouTubePlayer = () => {
      if (!isMounted) return;
      
      try {
        console.log('🎬 Creating YouTube player for video ID:', videoId);
        
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0, // Start paused to avoid browser blocking
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            enablejsapi: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              
              console.log('✅ YouTube IFrame API ready!');
              console.log('📹 Video loaded:', event.target.getVideoData());
              
              // Get video metadata (title, duration, etc.)
              const getMetadata = () => {
                try {
                  const duration = event.target.getDuration();
                  const videoData = event.target.getVideoData();
                  
                  if (duration && duration > 0) {
                    const videoMetadata = {
                      title: videoData.title || 'Unknown Title',
                      duration: duration,
                      author: videoData.author || 'Unknown Author'
                    };
                    console.log('📹 Video Metadata:', videoMetadata);
                    console.log('⏱️ Real Duration:', duration, 'seconds =', formatTime(duration));
                    onMetadataLoaded?.(videoMetadata);
                  } else {
                    console.log('⏳ Duration not ready yet, retrying...');
                    setTimeout(getMetadata, 200);
                  }
                } catch (error) {
                  console.error('❌ Error getting metadata:', error);
                }
              };
              
              // Start fetching metadata
              setTimeout(getMetadata, 300);
              
              onReady?.(event.target);
              setPlayerLoaded(true);
              
              // Start progress updates
              progressIntervalRef.current = setInterval(() => {
                if (event.target && event.target.getCurrentTime) {
                  const currentTime = event.target.getCurrentTime();
                  const duration = event.target.getDuration();
                  if (duration > 0) {
                    onProgress?.({ played: currentTime / duration, playedSeconds: currentTime });
                  }
                }
              }, 500);
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              console.log('📹 YouTube state changed:', event.data);
              
              // Log specific states
              switch(event.data) {
                case -1: console.log('⏸️ State: Unstarted'); break;
                case 0: console.log('✅ State: Ended'); break;
                case 1: console.log('▶️ State: Playing'); break;
                case 2: console.log('⏸️ State: Paused'); break;
                case 3: console.log('📶 State: Buffering'); break;
                case 5: console.log('📹 State: Cued'); break;
                default: console.log('❓ Unknown state:', event.data);
              }
              
              onStateChange?.(event.data, event.target);
            },
            onError: (error) => {
              if (!isMounted) return;
              console.error('❌ YouTube Player Error:', error);
              
              // Error codes: https://developers.google.com/youtube/iframe_api_reference#Events
              const errorMessages = {
                2: 'Invalid video ID',
                5: 'HTML5 player error',
                100: 'Video not found or private',
                101: 'Embed not allowed by owner',
                150: 'Embed not allowed by owner'
              };
              
              const errorMsg = errorMessages[error.data] || `Unknown error: ${error.data}`;
              console.error('❌ Error details:', errorMsg);
              alert(`Video Error: ${errorMsg}`);
              
              onError?.(error);
            }
          }
        });
      } catch (error) {
        console.error('❌ Failed to create YouTube Player:', error);
        alert('Failed to load video player');
      }
    };

    // Load YouTube IFrame API if not already loaded
    if (window.YT && window.YT.Player) {
      console.log('✅ YouTube API already loaded');
      loadYouTubePlayer();
    } else {
      console.log('📥 Loading YouTube IFrame API...');
      
      // Load YouTube IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // Create player when API is ready
      window.onYouTubeIframeAPIReady = () => {
        console.log('✅ YouTube IFrame API loaded');
        loadYouTubePlayer();
      };
    }

    return () => {
      isMounted = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.log('Player cleanup error:', e);
        }
      }
    };
  }, [videoId]);

  // Control playback
  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo && playerRef.current.pauseVideo) {
      if (playing) {
        console.log('▶️ Playing via YouTube API');
        playerRef.current.playVideo();
      } else {
        console.log('⏸️ Paused via YouTube API');
        playerRef.current.pauseVideo();
      }
    }
  }, [playing]);

  // Control volume
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  // Control playback rate
  useEffect(() => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        backgroundColor: '#000'
      }}
    />
  );
};

const VideoPlayer = ({ url, title, onClose }) => {
  const [playing, setPlaying] = useState(false); // Start paused to avoid autoplay issues
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Normalize YouTube URL
  const getProperYouTubeUrl = (videoUrl) => {
    if (!videoUrl) return null;
    
    // Extract video ID from any YouTube URL format
    let videoId = '';
    
    // Format: youtu.be/VIDEO_ID
    const shortMatch = videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }
    
    // Format: youtube.com/watch?v=VIDEO_ID or with additional parameters
    const watchMatch = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    
    // Return clean YouTube URL
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    return videoUrl;
  };

  const normalizedUrl = getProperYouTubeUrl(url);
  
  console.log('🎬 VideoPlayer - Original URL:', url);
  console.log('🔗 Normalized URL:', normalizedUrl);
  console.log('▶️ Playing state:', playing);
  
  // Force play on mount for better UX
  useEffect(() => {
    console.log('🚀 Forcing play state to true after mount');
    const timer = setTimeout(() => {
      if (isReady) {
        setPlaying(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isReady]);

  // Store YouTube player instance and metadata
  const [ytPlayer, setYtPlayer] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState({ title: '', duration: 0 });

  // Quality options for YouTube
  const qualityOptions = ['auto', '1080', '720', '480', '360'];
  const [quality, setQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (fullscreen) {
          toggleFullscreen();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [fullscreen, onClose]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
      if (state.playedSeconds !== undefined) {
        setPlayedSeconds(state.playedSeconds);
      }
    }
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
    setSeeking(true);
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    const seekTo = parseFloat(e.target.value);
    if (ytPlayer && ytPlayer.getDuration && ytPlayer.seekTo) {
      const duration = ytPlayer.getDuration();
      ytPlayer.seekTo(duration * seekTo, true);
      console.log('⏩ Seeked to:', seekTo * 100, '%');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setFullscreen(true);
      }).catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setFullscreen(false);
      });
    }
  };

  const handlePlaybackRateChange = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  };

  const skipTime = (seconds) => {
    if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.seekTo) {
      const currentTime = ytPlayer.getCurrentTime();
      ytPlayer.seekTo(currentTime + seconds, true);
      console.log(`⏩ Skipped ${seconds} seconds. New time:`, currentTime + seconds);
    } else {
      console.log('⚠️ Player not ready for seeking');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
      style={{ backgroundColor: '#000' }}
    >
      <div className="relative w-full h-full group">
        {normalizedUrl ? (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* YouTube Iframe */}
            <YouTubePlayer 
              url={normalizedUrl}
              playing={playing}
              volume={muted ? 0 : volume}
              playbackRate={playbackRate}
              onReady={(player) => {
                console.log('✅ YouTube player is ready!');
                setYtPlayer(player); // Store player instance
                setIsReady(true);
              }}
              onStateChange={(state, player) => {
                console.log('📹 YouTube state changed:', state);
                if (state === 1) { // Playing
                  console.log('▶️ Video is actually playing!');
                } else if (state === 2) { // Paused
                  console.log('⏸️ Video paused');
                }
              }}
              onError={(error) => {
                console.error('❌ YouTube error:', error);
              }}
              onProgress={(progress) => {
                if (!seeking) {
                  handleProgress(progress);
                }
              }}
              onMetadataLoaded={(metadata) => {
                console.log('📹 Metadata loaded:', metadata);
                setVideoMetadata(metadata);
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <p>Invalid video URL</p>
          </div>
        )}

        {/* Custom Overlays */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/70 flex flex-col justify-between pointer-events-none"
            >
              {/* Top Bar */}
              <div className="flex justify-between items-start p-3 sm:p-6 pointer-events-auto" style={{ zIndex: 300 }}>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-white uppercase tracking-wider drop-shadow-lg">
                    {videoMetadata.title || title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">
                    {videoMetadata.duration ? formatTime(videoMetadata.duration) : 'Now Playing'}
                  </p>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-white/10 rounded-full text-white transition-all transform hover:scale-110 backdrop-blur-sm relative z-[400]"
                  style={{ zIndex: 400 }}
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              {/* Center Play Button - Only show when paused or on hover */}
              <div className="flex-1 flex items-center justify-center pointer-events-auto">
                <AnimatePresence>
                  {(!playing || showControls) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        console.log('🔴 Manual play/pause button clicked!');
                        setPlaying(!playing);
                      }}
                      className={`bg-primary/20 backdrop-blur-md p-6 rounded-full text-white border-2 transition-all shadow-2xl ${
                        playing ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                      } border-primary/50 hover:border-primary`}
                    >
                      {playing ? (
                        <Pause className="w-16 h-16 fill-white" />
                      ) : (
                        <Play className="w-16 h-16 fill-white ml-2" />
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Controls */}
              <div className="p-3 sm:p-6 pointer-events-auto">
                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.001}
                    value={played}
                    onChange={handleSeekChange}
                    onMouseUp={handleSeekMouseUp}
                    onTouchEnd={handleSeekMouseUp}
                    className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{formatTime(playedSeconds || played * (videoMetadata.duration || 0))}</span>
                    <span>{videoMetadata.duration ? formatTime(videoMetadata.duration) : '--:--'}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Play/Pause */}
                    <button 
                      onClick={() => setPlaying(!playing)} 
                      className="p-2 hover:bg-white/10 rounded-full text-white transition-all"
                      title={playing ? 'Pause' : 'Play'}
                    >
                      {playing ? (
                        <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-white" />
                      ) : (
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-white" />
                      )}
                    </button>

                    {/* Skip Back 10s */}
                    <button 
                      onClick={() => skipTime(-10)} 
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-white transition-all"
                      title="Skip back 10 seconds"
                    >
                      <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Skip Forward 10s */}
                    <button 
                      onClick={() => skipTime(10)} 
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-white transition-all"
                      title="Skip forward 10 seconds"
                    >
                      <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    {/* Volume */}
                    <div className="flex items-center space-x-2 group/volume">
                      <button 
                        onClick={() => setMuted(!muted)} 
                        className="p-2 hover:bg-white/10 rounded-full text-white transition-all"
                      >
                        {muted ? (
                          <VolumeX className="w-6 h-6" />
                        ) : (
                          <Volume2 className="w-6 h-6" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-0 group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Playback Speed */}
                    <button 
                      onClick={handlePlaybackRateChange} 
                      className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-white/10 rounded-full text-white transition-all border border-white/20"
                      title="Playback speed"
                    >
                      {playbackRate}x
                    </button>

                    {/* Quality Selector */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowQualityMenu(!showQualityMenu)} 
                        className="p-2 hover:bg-white/10 rounded-full text-white transition-all"
                        title="Quality"
                      >
                        <Settings className="w-6 h-6" />
                      </button>
                      
                      <AnimatePresence>
                        {showQualityMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-md rounded-lg border border-white/20 py-2 min-w-[120px] shadow-2xl"
                          >
                            <div className="px-3 py-1 text-xs text-gray-400 border-b border-white/10 mb-1">
                              Quality
                            </div>
                            {qualityOptions.map((q) => (
                              <button
                                key={q}
                                onClick={() => {
                                  setQuality(q);
                                  setShowQualityMenu(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-all ${
                                  quality === q ? 'text-primary font-semibold' : 'text-white'
                                }`}
                              >
                                {q === 'auto' ? 'Auto' : q === '1080' ? '1080p' : q === '720' ? '720p' : q === '480' ? '480p' : '360p'}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Fullscreen */}
                    <button 
                      onClick={toggleFullscreen} 
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-white transition-all"
                      title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {fullscreen ? (
                        <Minimize className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VideoPlayer;
