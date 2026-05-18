// ── Username pill that uses the player's equipped banner as a background ──
// Falls back to plain text when no banner is equipped, so it's safe to drop in
// anywhere a username is rendered.

const SIZE_STYLES = {
  sm: { fontSize: 13, padX: 8,  padY: 2, radius: 6  },
  md: { fontSize: 15, padX: 12, padY: 4, radius: 8  },
  lg: { fontSize: 20, padX: 14, padY: 5, radius: 10 },
};

export default function BannerName({
  username,
  banner,
  size = 'md',
  isSelf = false,
  suffix = '',
  style = {},
  cinzel = false,
}) {
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;
  const hasBanner = !!(banner && banner.color);

  return (
    <span
      className={hasBanner ? 'banner-name' : ''}
      style={{
        display: 'inline-block',
        background: hasBanner ? banner.color : 'transparent',
        padding: hasBanner ? `${s.padY}px ${s.padX}px` : 0,
        borderRadius: s.radius,
        fontWeight: 700,
        fontSize: s.fontSize,
        fontFamily: cinzel ? 'Cinzel, serif' : 'inherit',
        color: hasBanner ? '#fff' : 'inherit',
        textShadow: hasBanner ? '0 1px 2px rgba(0,0,0,0.7)' : 'none',
        border: hasBanner ? '1px solid rgba(255,255,255,0.18)' : 'none',
        lineHeight: 1.2,
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        ...style,
      }}
      title={username}
    >
      {username}{isSelf && ' (you)'}{suffix}
    </span>
  );
}
