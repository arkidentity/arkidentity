'use client';

interface VideoEmbedProps {
  videoId?: string;
  title?: string;
}

export function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  // Check if this is a real YouTube ID (11 chars, alphanumeric + dash/underscore)
  const isRealYouTubeId = videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId);

  if (!videoId || !isRealYouTubeId) {
    return (
      <div className="video-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <p>Video coming soon</p>

        <style jsx>{`
          .video-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 24px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px dashed rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            margin-bottom: 20px;
            color: #5A6577;
          }
          .video-placeholder p {
            margin: 12px 0 0 0;
            font-size: 0.9rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="video-embed">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title || 'Lesson video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />

      <style jsx>{`
        .video-embed {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 */
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
        }
        iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
      `}</style>
    </div>
  );
}
