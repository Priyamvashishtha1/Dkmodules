"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialForm = {
  name: "",
  age: "",
  city: "",
  mobile: "",
  phoneModel: "",
  purchaseAmount: "",
  invoiceNumber: "",
  purchaseDate: getTodayDateInputValue()
};

export default function RewardsPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [successCard, setSuccessCard] = useState(null);
  const successCardRef = useRef(null);

  useEffect(() => {
    if (successCard && successCardRef.current) {
      successCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [successCard]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Registering customer and crediting points...");
    setSuccessCard(null);

    const response = await fetch("/api/customers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Registration failed.");
      return;
    }

    setStatus(`Customer registered. Wallet now has ${data.wallet.remainingPoints} points.`);
    setSuccessCard({
      name: data.customer.name,
      mobile: data.customer.mobile,
      model: data.purchase?.mobileModel || form.phoneModel,
      earnedPoints: data.purchase?.pointsEarned || 0,
      totalPoints: data.wallet.remainingPoints,
      invoiceNumber: data.purchase?.invoiceNumber || form.invoiceNumber,
      purchaseDate:
        data.purchase?.purchaseDate || `${form.purchaseDate}T${new Date().toISOString().split("T")[1]}`
    });

    setForm({
      ...initialForm,
      purchaseDate: getTodayDateInputValue()
    });
  }

  return (
    <div className="stack">
      <section className="card form-card">
        <p className="eyebrow">Scan & Get Reward Points</p>
        <h1>Customer Rewards Registration</h1>
        <p>Use this form at the billing counter after a purchase is completed.</p>

        <form className="form-grid two-col" onSubmit={handleSubmit}>
          <input
            placeholder="Customer name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <input
            placeholder="Age"
            type="number"
            value={form.age}
            onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
          />
          <input
            placeholder="City"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            required
          />
          <input
            placeholder="Mobile number"
            value={form.mobile}
            onChange={(event) => setForm((prev) => ({ ...prev, mobile: event.target.value }))}
            required
          />
          <input
            placeholder="Phone model purchased"
            value={form.phoneModel}
            onChange={(event) => setForm((prev) => ({ ...prev, phoneModel: event.target.value }))}
            required
          />
          <input
            placeholder="Purchase amount"
            type="number"
            value={form.purchaseAmount}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, purchaseAmount: event.target.value }))
            }
            required
          />
          <input
            placeholder="Invoice number"
            value={form.invoiceNumber}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, invoiceNumber: event.target.value }))
            }
            required
          />
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, purchaseDate: event.target.value }))
            }
            required
          />
          <button type="submit">Submit & Credit Points</button>
        </form>

        {status ? <p className="status">{status}</p> : null}
      </section>

      {successCard ? (
        <div className="popup-backdrop" onClick={() => setSuccessCard(null)}>
          <section
            className="popup-card"
            onClick={(event) => event.stopPropagation()}
            aria-live="polite"
            ref={successCardRef}
          >
            <p className="eyebrow">Points Credited</p>
            <h2>{successCard.name} is now enrolled</h2>
            <p className="popup-lead">
              Reward points were added successfully and are ready to redeem on the next purchase.
            </p>

            <div className="popup-metrics">
              <div>
                <span>Earned Now</span>
                <strong>{successCard.earnedPoints}</strong>
              </div>
              <div>
                <span>Total Points</span>
                <strong>{successCard.totalPoints}</strong>
              </div>
            </div>

            <div className="popup-details">
              <p>
                <span>Mobile</span>
                <strong>{successCard.mobile}</strong>
              </p>
              <p>
                <span>Model</span>
                <strong>{successCard.model}</strong>
              </p>
              <p>
                <span>Invoice</span>
                <strong>{successCard.invoiceNumber}</strong>
              </p>
              <p>
                <span>Purchase Time</span>
                <strong>
                  {new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(successCard.purchaseDate))}
                </strong>
              </p>
            </div>

            <div className="popup-actions">
              <Link
                href={`/check-points?mobile=${encodeURIComponent(successCard.mobile)}`}
                className="ghost-link"
              >
                Check Rewards
              </Link>
              <button type="button" onClick={() => setSuccessCard(null)}>
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
