// Screenshot carousel. Mintlify ships no carousel/gallery component, and five
// 660×1440 App Store shots in a row is a wall — so this is the App Store's own
// shape: one centred, its neighbours peeking, scaled back and dimmed.
//
// Everything lives INSIDE the export on purpose. Mintlify evaluates each named
// export on its own, so module-level consts read as undefined at render time
// and a module-level `<Chevron />` resolves against MDX's component scope
// rather than this file's ("Expected component `Chevron` to be defined").
// Both were real errors here, in that order.
// `slide` and `gap` are the two numbers worth tuning — pass either from the MDX
// (<Screens gap={40} ... />) or change the default here. They're applied inline
// rather than set in style.css because the offset arithmetic below depends on
// them: split across two files, a nudge in one silently misaligns the centring.
export const Screens = ({ shots, slide = 240, gap = 24 }) => {

  // Called as `{chevron(true)}`, never `<Chevron />` — see the note above.
  const chevron = (back) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={back ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );

  const [i, setI] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touch = useRef(null);
  const n = shots.length;
  const go = (d) => setI((p) => Math.min(n - 1, Math.max(0, p + d)));

  // Arrows walk the carousel whether or not it's zoomed, so the lightbox is a
  // bigger view of the same thing rather than a mode you have to leave first.
  // Body scroll is pinned while it's open — the page sliding around behind a
  // fixed overlay reads as the overlay being broken.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setZoomed(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else return;
      e.preventDefault();
    };
    if (!zoomed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomed, n]);

  // The track is flex-centred, so the middle slide sits centred at offset 0.
  // Shifting by the distance from it is all the positioning there is.
  const offset = ((n - 1) / 2 - i) * (slide + gap);

  return (
    <div
      className="carousel"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="carousel-viewport">
        <div className="carousel-track" style={{ gap: `${gap}px`, transform: `translateX(${offset}px)` }}>
          {shots.map((s, k) => (
            <button
              key={s.src}
              type="button"
              className={k === i ? "carousel-slide is-active" : "carousel-slide"}
              style={{ width: `${slide}px` }}
              onClick={() => (k === i ? setZoomed(true) : setI(k))}
              aria-label={k === i ? `Enlarge: ${s.alt}` : s.alt}
            >
              <img src={s.src} alt={k === i ? s.alt : ""} draggable="false" />
            </button>
          ))}
        </div>
      </div>

      <div className="carousel-controls">
        <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous screenshot">
          {chevron(true)}
        </button>
        <div className="carousel-dots">
          {shots.map((s, k) => (
            <button
              key={s.src}
              type="button"
              className={k === i ? "is-active" : ""}
              onClick={() => setI(k)}
              aria-label={`Screenshot ${k + 1} of ${n}`}
              aria-current={k === i}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} disabled={i === n - 1} aria-label="Next screenshot">
          {chevron(false)}
        </button>
      </div>

      {zoomed && (
        <div
          className="carousel-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={shots[i].alt}
          onClick={() => setZoomed(false)}
        >
          {/* The backdrop closes on click, so the buttons layered on it have to
              stop the event getting there — otherwise paging shuts the box. */}
          <button
            type="button"
            className="carousel-lightbox-close"
            onClick={(e) => { e.stopPropagation(); setZoomed(false); }}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <button
            type="button"
            className="carousel-lightbox-step is-prev"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            disabled={i === 0}
            aria-label="Previous screenshot"
          >
            {chevron(true)}
          </button>

          <img src={shots[i].src} alt={shots[i].alt} onClick={(e) => e.stopPropagation()} />

          <button
            type="button"
            className="carousel-lightbox-step is-next"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            disabled={i === n - 1}
            aria-label="Next screenshot"
          >
            {chevron(false)}
          </button>
        </div>
      )}
    </div>
  );
};
