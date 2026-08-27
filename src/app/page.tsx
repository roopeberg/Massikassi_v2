import { CreateEventForm } from "@/components/CreateEventForm";
import { Logo } from "@/components/Logo";

const steps = [
  {
    src: "/illustrations/step-1-create-event.svg",
    title: "Luo tapahtuma",
    description: "Nimeä reissu, mökkiviikonloppu tai mikä tahansa yhteinen meno.",
  },
  {
    src: "/illustrations/step-2-add-expenses.svg",
    title: "Lisää kulut",
    description: "Kirjaa kuka maksoi ja ketkä jakoivat kulun.",
  },
  {
    src: "/illustrations/step-3-settle-money.svg",
    title: "Tasaa rahat",
    description: "Massikassi kertoo selkeästi, kuka maksaa kenelle.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <Logo />
          <p className="mt-3 text-slate-600">Jaa yhteiset kulut, ilman tunnuksia.</p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl">
            Kulut jakoon.
            <br />
            Ilman säätöä.
          </h1>
          <p className="mt-4 max-w-md text-slate-600">
            Luo tapahtuma, kutsu porukka linkillä ja anna Massikassin laskea kuka maksaa kenelle.
          </p>
        </div>
        {/* eslint-disable @next/next/no-img-element -- decorative, pre-rendered SVGs, no benefit from next/image */}
        <div className="hidden justify-center lg:flex">
          <div className="relative h-96 w-80">
            <img src="/illustrations/money-bag-mascot.svg" alt="" className="absolute right-0 bottom-0 h-80 w-auto" />
            {/* Positioned to land in the mascot's raised right hand (~90%/70% into its box). */}
            <img
              src="/illustrations/expense-receipt.svg"
              alt=""
              className="absolute top-[68px] left-[210px] h-52 w-auto drop-shadow-md"
            />
            <img src="/illustrations/coins.svg" alt="" className="absolute bottom-6 left-0 h-16 w-auto" />
          </div>
        </div>
        {/* eslint-enable @next/next/no-img-element */}
      </div>

      <div className="mx-auto mt-8 max-w-md">
        <CreateEventForm />
        <p className="mt-4 text-center text-xs text-slate-400">
          Ei rekisteröitymistä. Tapahtumaan pääsee vain sen linkin kautta, jonka saat luotuasi sen.
        </p>
      </div>

      <div className="mt-20 grid gap-10 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.title} className="text-center">
            <div className="relative mx-auto h-24 w-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={step.src} alt="" className="h-24 w-24" />
              <span className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {i + 1}
              </span>
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">{step.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
