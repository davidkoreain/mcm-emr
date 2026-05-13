import React, { useState } from 'react';

const COLORS: [string, string][] = [
  ['#2563eb', '#dbeafe'],
  ['#059669', '#d1fae5'],
  ['#d97706', '#fef3c7'],
  ['#7c3aed', '#ede9fe'],
  ['#dc2626', '#fee2e2'],
  ['#0891b2', '#cffafe'],
  ['#ea580c', '#ffedd5'],
  ['#16a34a', '#dcfce7'],
];

function colorFor(name: string): [string, string] {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return COLORS[h % COLORS.length];
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

type AvatarProps = {
  name: string;
  photoUrl?: string;
  size?: number;
  style?: React.CSSProperties;
};

const Avatar: React.FC<AvatarProps> = ({ name, photoUrl, size = 36, style }) => {
  const [textColor, bgColor] = colorFor(name);
  const [imgError, setImgError] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  const fontSize = size <= 28 ? '0.6rem' : size <= 40 ? '0.8rem' : size <= 56 ? '1rem' : '1.4rem';
  const showPhoto = !!photoUrl && !imgError;

  const inner = showPhoto ? (
    <img
      src={photoUrl}
      alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      onError={() => setImgError(true)}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bgColor, color: textColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: '700', userSelect: 'none', letterSpacing: '-0.02em',
    }}>
      {initials(name)}
    </div>
  );

  return (
    <>
      <div
        onClick={showPhoto ? () => setEnlarged(true) : undefined}
        title={showPhoto ? `${name} — click to enlarge` : name}
        style={{ flexShrink: 0, cursor: showPhoto ? 'zoom-in' : 'default', borderRadius: '50%', ...style }}
      >
        {inner}
      </div>

      {enlarged && showPhoto && (
        <div
          onClick={() => setEnlarged(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.05)', // Very light backdrop
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            cursor: 'zoom-out',
            backdropFilter: 'blur(2px)', // Subtle blur instead of darkening
          }}
        >
          <div style={{
            background: 'white',
            padding: '0.5rem',
            borderRadius: '1rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'avatarPopup 0.2s ease-out'
          }}>
            <img
              src={photoUrl}
              alt={name}
              style={{
                width: Math.min(size * 4, 300),
                height: Math.min(size * 4, 300),
                borderRadius: '0.75rem', // Square with rounded corners for the popup
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div style={{ marginTop: '0.75rem', color: '#1e293b', fontSize: '1rem', fontWeight: '800' }}>
              {name}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
              Click anywhere to close
            </div>
          </div>
          <style>{`
            @keyframes avatarPopup {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default Avatar;
