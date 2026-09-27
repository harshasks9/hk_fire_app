import type { Metadata, Viewport } from "next";
import "./ht.css";

export const metadata: Metadata = {
  title: { absolute: "Home Theater Room" },
  description: "Design, evaluate, visualise and procure the dedicated home theatre: room, system, rack, alternatives, evaluator review and where to buy.",
};

export const viewport: Viewport = { themeColor: "#0a0b0d" };

export default function HtLayout({ children }: { children: React.ReactNode }) {
  return children;
}
