"use client";

import { loginUser } from "@/lib/hooya-api-client";
import { useState } from "react";

export default function Page() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    try {
      await loginUser(password);
      setMessage("Login successful!");
      window.location.href = "/";
    } catch (error) {
      setMessage("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <p>Logged in users may administer this instance.</p>
      <div className="login-form">
        <form onSubmit={handleSubmit}>
          <label htmlFor="password">Operator password</label>
          <br />
          <input
            type="password"
            name="password"
            id="password"
            required
          />
          <br />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Go"}
          </button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </>
  );
}

