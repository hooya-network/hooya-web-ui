"use client";

import { Login } from "@/actions";
import { redirect } from 'next/navigation'
import router from "next/router";
import { useState } from "react";

export default function Page() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const jwt = await Login(password);
    if (jwt) {
      localStorage.setItem("jwt", jwt)
    }
  };

  return (
    <>
      <p>Logged in users may administer this instance.</p>
      <div className="login-form">
        <form method="post" action="/" id="login" onSubmit={handleSubmit}>
          <label htmlFor="password">Operator password</label>
          <br />
          <input
            type="password"
            name="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button type="submit">Go</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </>
  );
}

// Action to handle login

