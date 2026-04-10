"use client";

import { useState } from "react";

export default function CheckPointsPage() {
  const [mobile, setMobile] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  async function handleCheck(event) {
    event.preventDefault();
    setStatus("Fetching wallet...");

    const response = await fetch(`/api/wallet/${mobile}`);
    const data = await response.json();

    if (!response.ok) {
      setResult(null);
      setStatus(data.error || "Wallet not found.");
      return;
    }

    setResult(data);
    setStatus("Wallet found.");
  }

  return (
    <div className="stack">
      <section className="card form-card">
        <p className="eyebrow">Customer Wallet Lookup</p>
        <h1>Check Reward Points</h1>

        <form className="inline-form" onSubmit={handleCheck}>
          <input
            placeholder="Enter mobile number"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            required
          />
          <button type="submit">Check Points</button>
        </form>

        {status ? <p className="status">{status}</p> : null}
      </section>

      {result ? (
        <section className="grid two-up">
          <article className="card">
            <h2>{result.customer.name}</h2>
            <p>{result.customer.city}</p>
            <div className="stats-grid">
              <div>
                <span>Total</span>
                <strong>{result.wallet.totalPoints}</strong>
              </div>
              <div>
                <span>Redeemed</span>
                <strong>{result.wallet.redeemedPoints}</strong>
              </div>
              <div>
                <span>Remaining</span>
                <strong>{result.wallet.remainingPoints}</strong>
              </div>
            </div>
          </article>

          <article className="card">
            <h2>Purchase History</h2>
            <div className="list">
              {result.purchases.map((purchase) => (
                <div key={purchase._id} className="list-row">
                  <div>
                    <strong>{purchase.mobileModel}</strong>
                    <span>{purchase.invoiceNumber}</span>
                  </div>
                  <div>
                    <strong>+{purchase.pointsEarned}</strong>
                    <span>points</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}

