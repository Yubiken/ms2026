export default function PageLoader({
  title = "Ładowanie",
  subtitle = "Przygotowuję dane",
  cards = 4,
}) {
  const placeholders = Array.from({ length: cards }, (_, index) => index)

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8 text-white sm:px-6 sm:py-10" aria-busy="true">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="section-title text-3xl font-black sm:text-4xl">
            {title}
          </h1>
          <div className="mx-auto mt-3 h-1 w-32 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
          <div className="mt-4 text-sm font-semibold text-gray-400">
            {subtitle}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {placeholders.slice(0, 4).map(item => (
            <div key={item} className="stadium-panel rounded-2xl p-4">
              <div className="skeleton-line h-3 w-24 rounded-full" />
              <div className="skeleton-line mt-4 h-8 w-14 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {placeholders.map(item => (
            <div key={item} className="match-ticket rounded-2xl p-5 sm:p-6">
              <div className="skeleton-line h-4 w-32 rounded-full" />
              <div className="skeleton-line mt-4 h-7 w-3/4 rounded-lg" />
              <div className="skeleton-line mt-3 h-4 w-44 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
