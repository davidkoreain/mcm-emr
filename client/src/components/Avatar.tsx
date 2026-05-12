import React from 'react';

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
  const fontSize = size <= 28 ? '0.6rem' : size <= 40 ? '0.8rem' : size <= 56 ? '1rem' : '1.4rem';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bgColor, color: textColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: '700', flexShrink: 0, userSelect: 'none',
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {initials(name)}
    </div>
  );
};

export default Avatar;
