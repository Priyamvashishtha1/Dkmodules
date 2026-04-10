import Link from "next/link";
import { QrCard } from "@/components/qr-card";

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Mobile Retail Loyalty Platform</p>
          <h1>Convert every phone sale into the next repeat purchase.</h1>
          <p className="hero-text">
            DK Enterprises Rewards helps your shop register customers, assign points,
            send WhatsApp reminders, and track repeat sales from one dashboard.
          </p>
          <div className="hero-actions">
            <Link href="/rewards" className="primary-link">
              Scan QR Registration
            </Link>
            <Link href="/admin/dashboard" className="ghost-link">
              Open Admin CRM
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="mini-metric">
            <strong>1 point</strong>
            <span>for every Rs 100 spent</span>
          </div>
          <div className="mini-metric">
            <strong>WhatsApp</strong>
            <span>purchase alerts and campaigns</span>
          </div>
          <div className="mini-metric">
            <strong>Repeat sales</strong>
            <span>tracked across customers and invoices</span>
          </div>
        </div>
      </section>

      <section className="grid three-up">
        <article className="card">
          <h2>Customer Flow</h2>
          <p>Register at billing, create the wallet, assign points, and send instant confirmation.</p>
        </article>
        <article className="card">
          <h2>Admin CRM</h2>
          <p>Track customers, purchases, offers, and points redemption from one clean dashboard.</p>
        </article>
        <article className="card">
          <h2>WhatsApp Engine</h2>
          <p>Trigger welcome, purchase, redemption, and campaign messages from the same system.</p>
        </article>
      </section>

      <section className="card accent-card">
        <h2>How the MVP works</h2>
        <div className="timeline">
          <div>
            <strong>1.</strong>
            <span>Customer scans QR and fills the rewards form.</span>
          </div>
          <div>
            <strong>2.</strong>
            <span>Purchase details create points automatically.</span>
          </div>
          <div>
            <strong>3.</strong>
            <span>Admin sees wallet balance, history, and campaign reach.</span>
          </div>
        </div>
      </section>

      <section className="card">
        <QrCard />
        <div className="qr-extra-actions">
          <Link href="/print-qr" className="ghost-link">
            Open Printable QR Card
          </Link>
        </div>
      </section>
    </div>
  );
}
