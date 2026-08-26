import { CreateEventForm } from "@/components/CreateEventForm";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="text-center">
        <h1>
          <Logo />
        </h1>
        <p className="mt-4 text-slate-600">Jaa yhteiset kulut, ilman tunnuksia.</p>
      </div>
      <CreateEventForm />
      <p className="text-center text-xs text-slate-400">
        Ei rekisteröitymistä. Tapahtumaan pääsee vain sen linkin kautta, jonka saat luotuasi sen.
      </p>
    </main>
  );
}
