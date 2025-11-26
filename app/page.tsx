import { Navbar1 } from "@/components/home-navbar";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat brightness-75 dark:brightness-50"
        style={{
          backgroundImage: "url('/images/app-background.jpg')",
        }}
      />

      {/* Frosted Glass Overlay */}
      <div className="fixed inset-0 -z-10 backdrop-blur-md dark:bg-black/30" />

      <div className="relative">
        {/* Navbar with frosted glass effect */}
        <div className="backdrop-blur-xl bg-white dark:bg-black border-b border-zinc-200/50 dark:border-zinc-800 shadow-lg dark:shadow-black/50">
          <Navbar1
            auth={{
              login: { title: "Connexion", url: "/auth/portal?mode=login" },
              signup: { title: "Inscription", url: "/auth/portal?mode=signup" },
            }}
          />
        </div>
      </div>
    </div>
  );
}
