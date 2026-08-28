import Link from "next/link";
import { CreateEventForm } from "@/components/CreateEventForm";

// Colors/type/spacing here are lifted deliberately close to the approved
// design reference (an exported design-canvas mockup a previous contributor
// shared) rather than the app's usual slate palette — this page intentionally
// looks different from the rest of the app.

const steps = [
  {
    number: 1,
    badge: "#f5b544",
    stroke: "#12141c",
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
    badge: "#f2653f",
    stroke: "#fbf7f0",
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
    badge: "#4fd39a",
    stroke: "#12141c",
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
    <main className="flex-1 bg-[#12141c] font-[family-name:var(--font-space-grotesk)] text-[#f4f2ee]">
      <div className="mx-auto max-w-6xl px-6 pb-16 sm:px-10 sm:pb-20 lg:px-14">
        {/* nav */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#f5b544]">
              <span className="font-[family-name:var(--font-bricolage)] text-lg font-extrabold text-[#12141c]">m</span>
            </div>
            <span className="font-[family-name:var(--font-bricolage)] text-lg font-semibold tracking-tight">
              massikassi
            </span>
          </div>
          {/* Decorative only — this page doesn't have a light theme (yet), so it's not a working toggle. */}
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2230]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa1b0" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="#9aa1b0" />
            </svg>
          </div>
        </div>

        {/* hero */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1e2230] px-4 py-2 text-[12.5px] font-medium text-[#f5b544]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#4fd39a]" />
              Ilmainen · ei tunnuksia · ei mainoksia
            </div>

            <h1 className="mt-6 font-[family-name:var(--font-bricolage)] text-6xl leading-[0.95] font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
              Kulut
              <br />
              jakoon.
              <br />
              <span className="text-[#f5b544]">Ilman säätöä.</span>
            </h1>

            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-[#b6bcc9] sm:text-xl">
              Yksi linkki koko porukalle. Kirjatkaa kulut sitä mukaa kun niitä syntyy, ja katsokaa lopussa kuka
              maksaa kenelle.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#luo-tapahtuma"
                className="flex h-[60px] items-center justify-center rounded-full bg-[#f5b544] px-8 text-[17px] font-bold text-[#12141c] hover:bg-[#ffc95f]"
              >
                Luo tapahtuma
              </a>
              <div className="flex items-center gap-2 text-sm text-[#9aa1b0]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4fd39a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Valmis 20 sekunnissa
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <CreateEventForm />
            <p className="mt-4 text-center text-sm text-[#8a8f9d]">
              Kadotitko vanhan tapahtuman linkin?{" "}
              <Link href="/recovery" className="text-[#f5b544] underline">
                Palauta sähköpostilla
              </Link>
            </p>
          </div>
        </div>

        {/* steps */}
        <div className="mt-20 sm:mt-24 lg:mt-28">
          <h2 className="font-[family-name:var(--font-bricolage)] text-3xl font-semibold tracking-tight sm:text-4xl">
            Kolme askelta, ei enempää
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col gap-5 rounded-[26px] bg-[#1a1e2a] p-7">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px]"
                    style={{ background: step.badge }}
                  >
                    <svg width="30" height="30" viewBox="0 0 48 48" fill="none" stroke={step.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      {step.icon}
                    </svg>
                  </div>
                  <span className="font-[family-name:var(--font-bricolage)] text-5xl font-extrabold text-[#262c3a]">
                    {step.number}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-[family-name:var(--font-bricolage)] text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#9aa1b0]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* closing band */}
        <div className="mt-16 flex flex-col items-start gap-6 rounded-[30px] bg-[#f5b544] p-8 sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:p-11">
          <div className="flex flex-col gap-2">
            <div className="font-[family-name:var(--font-bricolage)] text-3xl font-extrabold tracking-tight text-[#12141c] sm:text-4xl">
              Kuka maksoi mitä?
            </div>
            <div className="text-base text-[#4a3c17]">Selvitä se kertaheitolla — ilman exceliä ja ilman tunnuksia.</div>
          </div>
          <a
            href="#luo-tapahtuma"
            className="flex h-[60px] shrink-0 items-center justify-center rounded-full bg-[#12141c] px-8 text-[16.5px] font-bold whitespace-nowrap text-[#f5b544] hover:bg-[#1e2230]"
          >
            Aloita nyt
          </a>
        </div>
      </div>
    </main>
  );
}
