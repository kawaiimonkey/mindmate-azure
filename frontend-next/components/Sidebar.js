"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/mindmate";

const links = [
  { href: "/chat", label: "AI Check-in" },
  { href: "/dashboard", label: "Dashboard" }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  return (
    <aside className="sidebar">
      <div className="brand">MindMate</div>
      <nav className="nav-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link${pathname === link.href ? " active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
        <button type="button" className="nav-link logout" onClick={handleLogout}>
          Log out
        </button>
      </nav>
    </aside>
  );
}
