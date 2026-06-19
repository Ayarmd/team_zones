import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ThemePill from "../components/ThemePill";
import Logo from "../components/Logo";

export default function AuthLayout({ title, subtitle, children, backLink, centered = false }) {
  if (centered) {
    return (
      <main
        dir="rtl"
        className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 text-gray-900 transition-colors dark:bg-[#0b1020] dark:text-gray-100"
      >
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(107,84,120,0.1),transparent_42%),radial-gradient(circle_at_85%_88%,rgba(74,127,212,0.06),transparent_38%)] dark:bg-[radial-gradient(circle_at_15%_12%,rgba(107,84,120,0.22),transparent_42%),radial-gradient(circle_at_85%_88%,rgba(74,127,212,0.12),transparent_38%)]" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {backLink}
            <ThemePill />
          </div>
        </div>

        <Card className="relative z-[1] w-full max-w-[420px] border-gray-200/90 shadow-xl shadow-[#6B5478]/10 backdrop-blur-sm dark:border-gray-800 dark:shadow-black/40">
          <CardHeader className="items-center space-y-4 pb-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#6B5478]/10 ring-1 ring-[#6B5478]/25 dark:bg-[#6B5478]/20 dark:ring-[#6B5478]/35">
              <img src="/zones-logo.png" alt="ZONES" className="h-full w-full object-cover" />
            </span>
            <div className="space-y-1">
              <CardTitle className="text-xl">{title}</CardTitle>
              {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-8">{children}</CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <header className="auth-top">
          <Logo />
          <div className="header-actions">{backLink}</div>
        </header>
        <section className="auth-card neon-card">
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
          {children}
        </section>
      </div>
    </main>
  );
}
