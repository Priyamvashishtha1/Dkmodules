import Link from "next/link";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/purchases", label: "Purchases" },
  { href: "/admin/campaigns", label: "Campaigns" }
];

export function AdminPanelNav() {
  return (
    <div className="panel-nav">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

