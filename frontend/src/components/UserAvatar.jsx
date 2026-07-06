export default function UserAvatar({
  username,
  avatarUrl,
  className = "",
  textClassName = "",
}) {
  const initial = String(username || "?").trim().charAt(0).toUpperCase() || "?"

  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-sm font-black text-black ring-1 ring-white/15 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none"
          }}
        />
      ) : (
        <span className={textClassName}>{initial}</span>
      )}
    </span>
  )
}
