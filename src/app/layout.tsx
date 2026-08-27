import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Landing-page-only fonts (the design in scripts/../ReissuEtusivu reference).
// Scoped to that page's own wrapper, not the global body, so the rest of the
// app keeps Geist.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "massikassi",
  description: "Ilmainen ja anonyymi tapa jakaa yhteisiä kuluja",
};

/*
  Re-applies an explicit theme choice before the first paint, so it never
  flashes the OS default first. With nothing stored this does nothing at all
  and `color-scheme: light dark` follows the OS on its own.
  A plain inline tag rather than next/script: it has to run synchronously in
  <head>, ahead of any framework code, and there's nothing to load.
*/
const themeInit = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fi"
      /* themeInit stamps data-theme before React hydrates, so the client's
         <html> legitimately differs from the server's. */
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col bg-canvas font-sans text-ink">{children}</body>
    </html>
  );
}
