import { CreateEventForm } from "@/components/CreateEventForm";
import { ThemeToggle } from "@/components/ThemeToggle";

// Type and spacing here follow the `ReissuEtusivu` artboard in the design
// canvas. Colours were hardcoded to that artboard's dark values; they now go
// through the same semantic tokens as the event page (globals.css), so this
// page follows the theme toggle too. The dark rendering is unchanged — the
// tokens' dark values *are* the artboard's hexes.

// Step badges reuse the participant-avatar colours: they're the same three
// accent tones, and they already have a darkened light-theme variant.
const steps = [
  {
    number: 1,
    badge: "var(--avatar-1-bg)",
    stroke: "var(--avatar-1-fg)",
    title: "Luo tapahtuma",
    description: "Nimeä reissu ja itsesi. Muuta ei tarvita.",
    icon: (
      <>
        <rect x="10" y="6" width="28" height="36" rx="3" />
        <path d="M10 14h4M10 22h4M10 30h4" />
        <path d="M20 30l4-2 12-12a2.8 2.8 0 0 0-4-4L20 26l-2 6z" />
      </>
    ),
  },
  {
    number: 2,
    badge: "var(--avatar-2-bg)",
    stroke: "var(--avatar-2-fg)",
    title: "Lisää kulut",
    description: "Kuka maksoi, ketkä jakoivat. Sentin tarkkuudella.",
    icon: (
      <>
        <path d="M12 5h24v38l-4-3-4 3-4-3-4 3-4-3-4 3V5z" />
        <path d="M17 15h14M17 22h14M17 29h8" />
      </>
    ),
  },
  {
    number: 3,
    badge: "var(--avatar-3-bg)",
    stroke: "var(--avatar-3-fg)",
    title: "Tasaa rahat",
    description: "Lyhin lista siirtoja, joilla kaikki ovat kuitteja.",
    icon: (
      <>
        <circle cx="14" cy="16" r="6" />
        <circle cx="34" cy="16" r="6" />
        <path d="M6 40c0-7 4-11 8-11s8 4 8 11" />
        <path d="M26 40c0-7 4-11 8-11s8 4 8 11" />
        <path d="M19 26h10M25 22l4 4-4 4" />
      </>
    ),
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1 bg-canvas font-sans text-ink">
      <div className="mx-auto max-w-6xl px-6 pb-16 sm:px-10 sm:pb-20 lg:px-14">
        {/* nav */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-accent">
              <span className="font-display text-lg font-extrabold text-on-accent">m</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">massikassi</span>
          </div>
          <ThemeToggle />
        </div>

        {/* hero */}
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-[12.5px] font-medium text-accent-ink">
              <span className="h-[7px] w-[7px] rounded-full bg-positive-fill" />
              Ilmainen · ei tunnuksia · ei mainoksia
            </div>

            <h1 className="mt-6 font-display text-6xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
              Kulut
              <br />
              jakoon.
              <br />
              <span className="text-accent-ink">Ilman säätöä.</span>
            </h1>

            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-ink-soft sm:text-xl">
              Yksi linkki koko porukalle. Kirjatkaa kulut sitä mukaa kun niitä syntyy, ja katsokaa lopussa kuka
              maksaa kenelle.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#luo-tapahtuma"
                className="flex h-[60px] items-center justify-center rounded-full bg-accent px-8 text-[17px] font-bold text-on-accent hover:bg-accent-hover"
              >
                Luo tapahtuma
              </a>
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Valmis 20 sekunnissa
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <CreateEventForm />
          </div>
        </div>

        {/* steps */}
        <div className="mt-20 sm:mt-24 lg:mt-28">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Kolme askelta, ei enempää
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col gap-5 rounded-[26px] border border-line bg-surface p-7"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px]"
                    style={{ background: step.badge }}
                  >
                    <svg width="30" height="30" viewBox="0 0 48 48" fill="none" stroke={step.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      {step.icon}
                    </svg>
                  </div>
                  {/* Ghost numeral: the same value as the hairline, so it reads
                      as a watermark rather than as content in either theme. */}
                  <span className="font-display text-5xl font-extrabold text-line">{step.number}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-display text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* closing band */}
        <div className="mt-16 flex flex-col items-start gap-6 rounded-[30px] bg-accent p-8 sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:p-11">
          <div className="flex flex-col gap-2">
            <div className="font-display text-3xl font-extrabold tracking-tight text-on-accent sm:text-4xl">
              Kuka maksoi mitä?
            </div>
            <div className="text-base text-on-accent/75">
              Selvitä se kertaheitolla — ilman exceliä ja ilman tunnuksia.
            </div>
          </div>
          <a
            href="#luo-tapahtuma"
            className="flex h-[60px] shrink-0 items-center justify-center rounded-full bg-settle-card-bg px-8 text-[16.5px] font-bold whitespace-nowrap text-accent hover:opacity-90"
          >
            Aloita nyt
          </a>
        </div>
      </div>
    </main>
  );
}
