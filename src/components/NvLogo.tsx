export function NvLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo-nv.png"
      alt="Nouveau Variable"
      width={size}
      height={size}
      style={{ flexShrink: 0, objectFit: 'contain', display: 'block' }}
    />
  )
}
