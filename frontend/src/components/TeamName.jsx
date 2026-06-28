const teamFlags = {
  argentina: "🇦🇷",
  argentyna: "🇦🇷",
  algeria: "🇩🇿",
  algieria: "🇩🇿",
  anglia: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  australia: "🇦🇺",
  austria: "🇦🇹",
  belgium: "🇧🇪",
  belgia: "🇧🇪",
  "bosnia i hercegowina": "🇧🇦",
  "bosnia and herzegovina": "🇧🇦",
  brazil: "🇧🇷",
  brazylia: "🇧🇷",
  canada: "🇨🇦",
  kanada: "🇨🇦",
  "cape verde": "🇨🇻",
  "republika zielonego przyladka": "🇨🇻",
  chile: "🇨🇱",
  chorwacja: "🇭🇷",
  colombia: "🇨🇴",
  kolumbia: "🇨🇴",
  "costa rica": "🇨🇷",
  croatia: "🇭🇷",
  curacao: "🇨🇼",
  "czech republic": "🇨🇿",
  denmark: "🇩🇰",
  "demokratyczna republika kongo": "🇨🇩",
  "dr congo": "🇨🇩",
  ecuador: "🇪🇨",
  ekwador: "🇪🇨",
  egypt: "🇪🇬",
  egipt: "🇪🇬",
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  france: "🇫🇷",
  francja: "🇫🇷",
  germany: "🇩🇪",
  niemcy: "🇩🇪",
  ghana: "🇬🇭",
  greece: "🇬🇷",
  haiti: "🇭🇹",
  hiszpania: "🇪🇸",
  holandia: "🇳🇱",
  holland: "🇳🇱",
  iran: "🇮🇷",
  iraq: "🇮🇶",
  italy: "🇮🇹",
  "ivory coast": "🇨🇮",
  japan: "🇯🇵",
  japonia: "🇯🇵",
  jordan: "🇯🇴",
  mexico: "🇲🇽",
  meksyk: "🇲🇽",
  morocco: "🇲🇦",
  maroko: "🇲🇦",
  netherlands: "🇳🇱",
  "new zealand": "🇳🇿",
  nigeria: "🇳🇬",
  norway: "🇳🇴",
  norwegia: "🇳🇴",
  panama: "🇵🇦",
  paraguay: "🇵🇾",
  paragwaj: "🇵🇾",
  poland: "🇵🇱",
  portugal: "🇵🇹",
  portugalia: "🇵🇹",
  qatar: "🇶🇦",
  "republika poludniowej afryki": "🇿🇦",
  "republic of south africa": "🇿🇦",
  "saudi arabia": "🇸🇦",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  senegal: "🇸🇳",
  serbia: "🇷🇸",
  "south africa": "🇿🇦",
  "south korea": "🇰🇷",
  spain: "🇪🇸",
  sweden: "🇸🇪",
  szwajcaria: "🇨🇭",
  szwecja: "🇸🇪",
  switzerland: "🇨🇭",
  tunisia: "🇹🇳",
  turkey: "🇹🇷",
  ukraine: "🇺🇦",
  uruguay: "🇺🇾",
  usa: "🇺🇸",
  "united states": "🇺🇸",
  "united states of america": "🇺🇸",
  uzbekistan: "🇺🇿",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "wybrzeze kosci sloniowej": "🇨🇮",
}

const normalizeTeamName = (name) => String(name || "")
  .normalize("NFD")
  .replace(/ł/g, "l")
  .replace(/Ł/g, "L")
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
