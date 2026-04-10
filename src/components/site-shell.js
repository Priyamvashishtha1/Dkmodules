import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/rewards", label: "Rewards" },
  { href: "/check-points", label: "Check Points" },
  { href: "/offers", label: "Offers" },
  { href: "/admin", label: "Admin" }
];

export function SiteShell({ children }) {
  return (
    <div className="page-shell">
      <header className="topbar">
        <Link href="/" className="brand">
          DK Enterprises
          <span>Retail CRM + Rewards</span>
        </Link>
        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

