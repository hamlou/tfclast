export const extractYouTubeId = (url) => {
  if (!url) return null;

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /[?&]v=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

export const getVideoDeduplicationKey = (video) => {
  if (video?.youtubeId) return `youtube:${video.youtubeId}`;
  const youtubeId = extractYouTubeId(video?.videoUrl);
  if (youtubeId) return `youtube:${youtubeId}`;
  if (video?.id) return `id:${video.id}`;
  if (video?.title) return `title:${video.title.trim().toLowerCase()}`;
  return null;
};
