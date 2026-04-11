import Link from "next/link";
import { QrCard } from "@/components/qr-card";

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Welcome to DK Enterprises</p>
          <h1>Exciting New Offer Just for You!</h1>
          <p className="hero-text">
            Thank you for visiting DK Enterprises. We’re excited to introduce our
            latest rewards offer! Shop with us and earn points on every purchase.
            The more you shop, the more rewards you unlock.
          </p>

          <div className="hero-actions">
            <Link href="/rewards" className="primary-link">
              Join Rewards Program
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="mini-metric">
            <strong>Earn Points</strong>
            <span> Get 1 point for every ₹100 spent</span>
          </div>
          <div className="mini-metric">
            <strong>Special Offers</strong>
            <span> Exclusive deals for registered customers</span>
          </div>
          <div className="mini-metric">
            <strong>Easy Rewards</strong>
            <span> Redeem points on your next purchase</span>
          </div>
        </div>
      </section>

      <section className="grid three-up">
        <article className="card">
          <h2>Welcome Bonus</h2>
          <p>Sign up today and receive bonus points instantly in your wallet.</p>
        </article>
        <article className="card">
          <h2>Shop & Earn</h2>
          <p>Every purchase adds points that you can redeem for discounts.</p>
        </article>
        <article className="card">
          <h2>Stay Updated</h2>
          <p>Get WhatsApp updates on new offers, rewards, and exclusive deals.</p>
        </article>
      </section>

      <section className="card accent-card">
        <h2>How to Get Started</h2>
        <div className="timeline">
          <div>
            <strong>1.</strong>
            <span>Scan the QR code and register yourself.</span>
          </div>
          <div>
            <strong>2.</strong>
            <span>Start shopping and earn reward points.</span>
          </div>
          <div>
            <strong>3.</strong>
            <span>Redeem your points on your next visit.</span>
          </div>
        </div>
      </section>

      <section className="card">
        <QrCard />
        <div className="qr-extra-actions">
          <Link href="/print-qr" className="ghost-link">
            Get Your QR Code
          </Link>
        </div>
      </section>
    </div>
  );
} 