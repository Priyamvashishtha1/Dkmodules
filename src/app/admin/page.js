"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Signing in...");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Login failed.");
      return;
    }

    window.localStorage.setItem("dk-admin-token", data.token);
    setStatus("Login successful. Redirecting...");
    router.push("/admin/dashboard");
  }

  return (
    <div className="stack narrow">
      <section className="card form-card">
        <p className="eyebrow">Admin CRM</p>
        <h1>Owner Login</h1>
        <p>Use the admin credentials from your .env file for the first login.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {status ? <p className="status">{status}</p> : null}
      </section>
    </div>
  );
}
