import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo size="sm" />
      <h1 className="font-display text-2xl font-bold">Tätä sivua ei löytynyt</h1>
      <p className="text-ink-muted">Tarkista linkki, tai luo uusi tapahtuma.</p>
      <Link href="/" className="font-medium text-accent-ink underline underline-offset-2">
        Etusivulle
      </Link>
    </main>
  );
}
