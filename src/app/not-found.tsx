import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 bg-canvas px-4 text-center text-ink">
      <Logo size="sm" />
      <h1 className="text-2xl font-bold">Tätä sivua ei löytynyt</h1>
      <p className="text-ink-soft">Tarkista linkki, tai luo uusi tapahtuma.</p>
      <Link href="/" className="text-ink underline">
        Etusivulle
      </Link>
    </main>
  );
}
