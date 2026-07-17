import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkillPrint | Skill Gap Analysis and Market Readiness Score",
  description:
    "Analyze your skills against real market demand. Get your Market Readiness Score, learning roadmap, and salary benchmarks. Free and no login.",
};

export default function SkillPrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
