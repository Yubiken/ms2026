import { Link } from "react-router-dom"

function EmptyIcon({ type }) {
  const sharedProps = {
    width: "26",
    height: "26",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  }

  if (type === "ranking") {
    return (
      <svg {...sharedProps}>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M7 7H4a3 3 0 0 0 3 3" />
        <path d="M17 7h3a3 3 0 0 1-3 3" />
      </svg>
    )
  }

  if (type === "admin") {
    return (
      <svg {...sharedProps}>
        <path d="M4 7h16" />
        <path d="M7 4v6" />
        <path d="M17 4v6" />
        <path d="M6 13h12" />
        <path d="M8 17h8" />
      </svg>
    )
  }

  if (type === "predictions") {
    return (
      <svg {...sharedProps}>
        <path d="M5 6h14" />
        <path d="M5 12h14" />
        <path d="M5 18h9" />
        <path d="M17 16l2 2 3-4" />
      </svg>
    )
  }

  return (
    <svg {...sharedProps}>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 9h16" />
      <path d="M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      <path d="M8 13h3" />
      <path d="M13 16h3" />
    </svg>
  )
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon = "matches",
  compact = false,
}) {
  const actionClassName = "mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-2 text-sm font-bold uppercase text-white shadow-lg transition hover:from-green-700 hover:to-emerald-600"

  return (
    <div className={`stadium-panel rounded-2xl text-center ${compact ? "p-5" : "p-8"}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-green-300">
        <EmptyIcon type={icon} />
      </div>

      <div className="mt-4 text-xl font-black text-white">
        {title}
      </div>

      {description && (
        <div className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-gray-400">
          {description}
        </div>
      )}

      {actionLabel && actionTo && (
        <Link to={actionTo} className={actionClassName}>
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className={actionClassName}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
