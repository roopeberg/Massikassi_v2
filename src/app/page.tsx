import { CreateEventForm } from "@/components/CreateEventForm";
import { Logo } from "@/components/Logo";
import { NotebookIcon, ReceiptIcon, ReceiptIllustration, TransferIcon } from "@/components/icons";

const steps = [
  {
    icon: NotebookIcon,
    title: "Luo tapahtuma",
    description: "Nimeä reissu, mökkiviikonloppu tai mikä tahansa yhteinen meno.",
  },
  {
    icon: ReceiptIcon,
    title: "Lisää kulut",
    description: "Kirjaa kuka maksoi ja ketkä jakoivat kulun.",
  },
  {
    icon: TransferIcon,
    title: "Tasaa rahat",
    description: "Massikassi kertoo selkeästi, kuka maksaa kenelle.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
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
        <div className="hidden justify-center lg:flex">
          <ReceiptIllustration className="h-56 w-56" />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-md">
        <CreateEventForm />
        <p className="mt-4 text-center text-xs text-slate-400">
          Ei rekisteröitymistä. Tapahtumaan pääsee vain sen linkin kautta, jonka saat luotuasi sen.
        </p>
      </div>

      <div className="mt-20 grid gap-10 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.title} className="text-center">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <step.icon className="h-9 w-9 text-slate-700" />
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
