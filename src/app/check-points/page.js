"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CheckPointsPage() {
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [redeemStatus, setRedeemStatus] = useState("");

  useEffect(() => {
    const queryMobile = searchParams.get("mobile");
    if (queryMobile) {
      setMobile(queryMobile);
    }
  }, [searchParams]);

  async function handleCheck(event) {
    event?.preventDefault?.();
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

  async function handleRedeem(event) {
    event.preventDefault();
    setRedeemStatus("Redeeming points...");

    const response = await fetch("/api/wallet/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile,
        points: Number(redeemPoints)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setRedeemStatus(data.error || "Could not redeem points.");
      return;
    }

    setRedeemStatus(`Redeemed successfully. Remaining points: ${data.wallet.remainingPoints}`);
    setRedeemPoints("");
    await handleCheck();
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

            <form className="form-grid redeem-form" onSubmit={handleRedeem}>
              <h3>Redeem Points</h3>
              <input
                type="number"
                min="1"
                max={result.wallet.remainingPoints}
                placeholder="Enter points to redeem"
                value={redeemPoints}
                onChange={(event) => setRedeemPoints(event.target.value)}
                required
              />
              <button type="submit">Redeem Now</button>
              {redeemStatus ? <p className="status">{redeemStatus}</p> : null}
            </form>
          </article>

          <article className="card">
            <h2>Purchase History</h2>
            <div className="list">
              {result.purchases.map((purchase) => (
                <div
                  key={purchase._id || purchase.id || `${purchase.invoiceNumber}-${purchase.purchaseDate}`}
                  className="list-row"
                >
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
