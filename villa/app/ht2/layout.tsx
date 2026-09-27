import type { Metadata, Viewport } from "next";
import "../ht/ht.css";

export const metadata: Metadata = {
  title: { absolute: "Home Theater Room · India" },
  description: "A movie-first home theatre under ₹30 lakh, every part sold in India: the system, room, rack, alternatives, evaluator review, assumptions tested and a Pareto of every combination.",
};

export const viewport: Viewport = { themeColor: "#0a0b0d" };

export default function Ht2Layout({ children }: { children: React.ReactNode }) {
  return children;
}
