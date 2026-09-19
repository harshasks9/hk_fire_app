import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProjectProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { EntityDialogs } from "@/components/Entity";

export const metadata: Metadata = {
  title: "The Villa — interiors & fit-out",
  description:
    "A digital twin and command centre for the interiors of a 5 BHK villa in Hyderabad: spaces, decisions, cost, procurement and snagging in one place.",
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;450;500;550;600&display=swap"
        />
      </head>
      <body>
        <ProjectProvider>
          <EntityDialogs>
            <Shell>{children}</Shell>
          </EntityDialogs>
        </ProjectProvider>
      </body>
    </html>
  );
}
