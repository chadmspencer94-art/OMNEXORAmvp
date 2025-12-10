// Onboarding segment layout - all onboarding routes require authentication and use cookies()
// This ensures all child routes under /onboarding are dynamic
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

