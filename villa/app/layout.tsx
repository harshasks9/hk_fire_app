import type { Metadata, Viewport } from "next";
import "@fontsource-variable/schibsted-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { ProjectProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { EntityDialogs } from "@/components/Entity";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "Villa 14 — interiors & fit-out", template: "%s · Villa 14" },
  description:
    "A digital twin and command centre for the interiors of a 5 BHK villa in Hyderabad: spaces, decisions, cost, procurement and snagging in one place.",
};

export const viewport: Viewport = {
  themeColor: "#f2f1ed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProjectProvider>
          <ToastProvider>
            <EntityDialogs>
              <Shell>{children}</Shell>
            </EntityDialogs>
          </ToastProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
