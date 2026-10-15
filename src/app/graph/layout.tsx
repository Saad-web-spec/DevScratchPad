/* The graph studio's own typefaces (self-hosted, variable, OFL); the files load only where /graph text renders. */
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";

export default function GraphLayout({ children }: { children: React.ReactNode }) {
  return <div className="graph-theme">{children}</div>;
}
