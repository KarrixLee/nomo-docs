// Screenshot carousel. Mintlify ships no carousel/gallery component, and five
// 660×1440 App Store shots in a row is a wall — so this is the App Store's own
// shape: one centred, its neighbours peeking, scaled back and dimmed.
//
// Everything lives INSIDE the export on purpose. Mintlify evaluates each named
// export on its own, so module-level consts read as undefined at render time
// and a module-level `<Chevron />` resolves against MDX's component scope
// rather than this file's ("Expected component `Chevron` to be defined").
// Both were real errors here, in that order.
export const Screens = ({ shots }) => {
  // Slide geometry in px, not rem: the JS offset below and the .carousel-slide
  // width in style.css have to agree exactly, and a rem would drift the moment
  // a root font-size differed. Change the two together.
  const SLIDE = 240;
  const GAP = 24;

  // Called as `{chevron(true)}`, never `<Chevron />` — see the note above.
  const chevron = (back) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={back ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );

  const [i, setI] = useState(0);
  const touch = useRef(null);
  const n = shots.length;
  const go = (d) => setI((p) => Math.min(n - 1, Math.max(0, p + d)));

  // The track is flex-centred, so the middle slide sits centred at offset 0.
  // Shifting by the distance from it is all the positioning there is.
  const offset = ((n - 1) / 2 - i) * (SLIDE + GAP);

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
        <div className="carousel-track" style={{ transform: `translateX(${offset}px)` }}>
          {shots.map((s, k) => (
            <button
              key={s.src}
              type="button"
              className={k === i ? "carousel-slide is-active" : "carousel-slide"}
              onClick={() => setI(k)}
              tabIndex={k === i ? -1 : 0}
              aria-label={s.alt}
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
    </div>
  );
};
