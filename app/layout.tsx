import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import Analytics from "@/components/Analytics";
import ChartTooltips from "@/components/ChartTooltips";
import Chatbot from "@/components/Chatbot";
import { ChatProvider } from "@/components/ChatProvider";
import CommandPalette from "@/components/CommandPalette";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE } from "@/content/site";

// Only weight 600 is used; the full variable font is several times larger.
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-serif",
  display: "swap",
});
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

const TITLE = `${SITE.name} | ML engineer`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: TITLE, template: `%s | ${SITE.name}` },
  description: SITE.description,
  authors: [{ name: SITE.name, url: SITE.url }],
  openGraph: {
    title: TITLE,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
};

// Runs before paint: an explicit choice from storage wins, otherwise the OS
// setting. It also points the browser UI color at the chosen theme, since the
// media-scoped theme-color tags only follow the OS setting.
const themeScript = `(function(){var t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark')t=s;}catch(e){}document.documentElement.dataset.theme=t;var c=t==='dark'?'#0e0f11':'#fafaf7';var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute('content',c);})();`;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  jobTitle: "ML Engineer",
  url: SITE.url,
  email: `mailto:${SITE.email}`,
  sameAs: [SITE.github, SITE.linkedin],
  address: { "@type": "PostalAddress", addressRegion: "NJ", addressCountry: "US" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Texas A&M University-Corpus Christi" },
  knowsAbout: ["Model inference", "LLM serving", "LLM evaluation", "Quantization", "OpenVINO"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The chat widget only renders where the API key exists (production), so a
  // preview deployment without secrets shows no broken assistant.
  const chatEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ThemeProvider>
          <ChatProvider enabled={chatEnabled}>
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
            <Chatbot />
            <CommandPalette />
            <ChartTooltips />
            <Analytics />
          </ChatProvider>
        </ThemeProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </body>
    </html>
  );
}
