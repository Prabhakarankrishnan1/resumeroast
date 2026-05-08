import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkillPrint — Map Your Skills Against Market Demand | ResumeRoast",
  description:
    "Free AI skill analysis tool. Upload your resume, pick your target role, see a visual radar chart of your skills vs market demand. Find your gaps and get a personalized learning roadmap.",
};

export default function SkillPrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
