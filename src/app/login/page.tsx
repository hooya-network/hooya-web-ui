"use client";

import { login } from "@/actions";
import { useFormState } from "react-dom";
import { useEffect } from "react";

export default function Page() {
  const [state, formAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      const result = await login(formData);
      
      if (result.success && result.jwt) {
        return { 
          message: "Login successful!", 
          jwt: result.jwt,
          success: true 
        };
      } else {
        return { 
          message: result.error || "Login failed",
          success: false 
        };
      }
    },
    { message: "", success: false }
  );

  // Handle successful login
  useEffect(() => {
    if (state.success && state.jwt) {
      localStorage.setItem("jwt", state.jwt);
      window.location.href = "/";
    }
  }, [state]);

  return (
    <>
      <p>Logged in users may administer this instance.</p>
      <div className="login-form">
        <form action={formAction}>
          <label htmlFor="password">Operator password</label>
          <br />
          <input
            type="password"
            name="password"
            id="password"
            required
          />
          <br />
          <button type="submit">
            Go
          </button>
        </form>
        {state.message && <p>{state.message}</p>}
      </div>
    </>
  );
}

