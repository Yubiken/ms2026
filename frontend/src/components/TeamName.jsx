const teamFlags = {
  argentina: "🇦🇷",
  australia: "🇦🇺",
  austria: "🇦🇹",
  belgium: "🇧🇪",
  "bosnia and herzegovina": "🇧🇦",
  brazil: "🇧🇷",
  canada: "🇨🇦",
  chile: "🇨🇱",
  colombia: "🇨🇴",
  "costa rica": "🇨🇷",
  croatia: "🇭🇷",
  denmark: "🇩🇰",
  ecuador: "🇪🇨",
  egypt: "🇪🇬",
  england: "🏴",
  france: "🇫🇷",
  germany: "🇩🇪",
  ghana: "🇬🇭",
  greece: "🇬🇷",
  holland: "🇳🇱",
  iran: "🇮🇷",
  italy: "🇮🇹",
  japan: "🇯🇵",
  mexico: "🇲🇽",
  morocco: "🇲🇦",
  netherlands: "🇳🇱",
  "new zealand": "🇳🇿",
  nigeria: "🇳🇬",
  norway: "🇳🇴",
  panama: "🇵🇦",
  paraguay: "🇵🇾",
  poland: "🇵🇱",
  portugal: "🇵🇹",
  qatar: "🇶🇦",
  "republic of south africa": "🇿🇦",
  "saudi arabia": "🇸🇦",
  scotland: "🏴",
  senegal: "🇸🇳",
  serbia: "🇷🇸",
  "south africa": "🇿🇦",
  "south korea": "🇰🇷",
  spain: "🇪🇸",
  switzerland: "🇨🇭",
  tunisia: "🇹🇳",
  turkey: "🇹🇷",
  ukraine: "🇺🇦",
  uruguay: "🇺🇾",
  usa: "🇺🇸",
  "united states": "🇺🇸",
  "united states of america": "🇺🇸",
  uzbekistan: "🇺🇿",
  wales: "🏴",
}

const normalizeTeamName = (name) => String(name || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[.'’]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase()

export default function TeamName({
  name,
  className = "",
  flagClassName = "",
  textClassName = "",
}) {
  const flag = teamFlags[normalizeTeamName(name)]

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 align-baseline ${className}`}>
      {flag && (
        <span className={`shrink-0 leading-none ${flagClassName}`} aria-hidden="true">
          {flag}
        </span>
      )}
      <span className={`min-w-0 ${textClassName}`}>{name}</span>
    </span>
  )
}
