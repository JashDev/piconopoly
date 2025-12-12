import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Estado inicial consistente entre servidor y cliente
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Establecer el tema después de la hidratación
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    let shouldBeDark = false;
    
    if (savedTheme === "dark") {
      shouldBeDark = true;
    } else if (savedTheme === "light") {
      shouldBeDark = false;
    } else {
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    setIsDark(shouldBeDark);
    
    // Aplicar el tema al DOM
    if (shouldBeDark) {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
      document.documentElement.classList.remove("dark-mode");
    }
  }, []);

  // Actualizar el tema cuando cambia isDark
  useEffect(() => {
    if (!mounted) return;
    
    if (isDark) {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light-mode");
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Durante la hidratación, mostrar un estado neutral
  if (!mounted) {
    return (
      <button
        className="action-button"
        aria-label="Toggle dark mode"
        disabled
      >
        🌙
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="action-button"
      aria-label="Toggle dark mode"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}

