import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Runs before hydration (inlined in the document head) so there is no flash of the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("tv-theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}var r=document.documentElement;r.classList.toggle("light",t==="light");r.classList.toggle("dark",t==="dark");r.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"#faf8fd":"#120c1c")}catch(e){}})()`;

function apply(t: Theme) {
  const r = document.documentElement;
  r.classList.toggle("light", t === "light");
  r.classList.toggle("dark", t === "dark");
  r.style.colorScheme = t;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", t === "light" ? "#faf8fd" : "#120c1c");
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem("tv-theme", next);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
      className={`grid size-9 place-items-center rounded-xl bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
