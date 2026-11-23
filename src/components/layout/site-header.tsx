import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
