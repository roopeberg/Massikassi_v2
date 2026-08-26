import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Tätä sivua ei löytynyt</h1>
      <p className="text-slate-600">Tarkista linkki, tai luo uusi tapahtuma.</p>
      <Link href="/" className="text-slate-900 underline">
        Etusivulle
      </Link>
    </main>
  );
}
