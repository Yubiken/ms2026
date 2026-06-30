const teamFlagCodes = {
  argentina: "ar",
  argentyna: "ar",
  algeria: "dz",
  algieria: "dz",
  anglia: "gb-eng",
  australia: "au",
  austria: "at",
  belgium: "be",
  belgia: "be",
  "bosnia i hercegowina": "ba",
  "bosnia and herzegovina": "ba",
  brazil: "br",
  brazylia: "br",
  canada: "ca",
  kanada: "ca",
  "cape verde": "cv",
  "republika zielonego przyladka": "cv",
  chile: "cl",
  chorwacja: "hr",
  colombia: "co",
  kolumbia: "co",
  "costa rica": "cr",
  croatia: "hr",
  curacao: "cw",
  "czech republic": "cz",
  denmark: "dk",
  "demokratyczna republika kongo": "cd",
  "dr congo": "cd",
  ecuador: "ec",
  ekwador: "ec",
  egypt: "eg",
  egipt: "eg",
  england: "gb-eng",
  france: "fr",
  francja: "fr",
  germany: "de",
  niemcy: "de",
  ghana: "gh",
  greece: "gr",
  haiti: "ht",
  hiszpania: "es",
  holandia: "nl",
  holland: "nl",
  iran: "ir",
  iraq: "iq",
  italy: "it",
  "ivory coast": "ci",
  japan: "jp",
  japonia: "jp",
  jordan: "jo",
  mexico: "mx",
  meksyk: "mx",
  morocco: "ma",
  maroko: "ma",
  netherlands: "nl",
  "new zealand": "nz",
  nigeria: "ng",
  norway: "no",
  norwegia: "no",
  panama: "pa",
  paraguay: "py",
  paragwaj: "py",
  poland: "pl",
  portugal: "pt",
  portugalia: "pt",
  qatar: "qa",
  "republika poludniowej afryki": "za",
  "republic of south africa": "za",
  "saudi arabia": "sa",
  scotland: "gb-sct",
  senegal: "sn",
  serbia: "rs",
  "south africa": "za",
  "south korea": "kr",
  spain: "es",
  sweden: "se",
  szwajcaria: "ch",
  szwecja: "se",
  switzerland: "ch",
  tunisia: "tn",
  turkey: "tr",
  ukraine: "ua",
  uruguay: "uy",
  usa: "us",
  "united states": "us",
  "united states of america": "us",
  uzbekistan: "uz",
  wales: "gb-wls",
  "wybrzeze kosci sloniowej": "ci",
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

const getFlagUrl = (code) => `https://flagcdn.com/w40/${code}.png`

export default function TeamName({
  name,
  className = "",
  flagClassName = "",
  textClassName = "",
}) {
  const flagCode = teamFlagCodes[normalizeTeamName(name)]

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 align-baseline ${className}`}>
      {flagCode && (
        <img
          src={getFlagUrl(flagCode)}
          alt=""
          loading="lazy"
          className={`h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-white/20 sm:h-4 sm:w-6 ${flagClassName}`}
          onError={(event) => {
            event.currentTarget.style.display = "none"
          }}
        />
      )}
      <span className={`min-w-0 ${textClassName}`}>{name}</span>
    </span>
  )
}
