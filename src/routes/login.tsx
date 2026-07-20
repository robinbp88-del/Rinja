import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signIn, signUp } from "../lib/auth";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();

  const [registerMode, setRegisterMode] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    try {
      setLoading(true);
      setError("");

      if (registerMode) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }

      navigate({ to: "/home" });
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">

        <h1 className="text-3xl font-bold text-center">
          {registerMode ? "Create account" : "Sign in"}
        </h1>

        {registerMode && (
          <input
            className="w-full rounded-lg border p-3"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-lg bg-black p-3 text-white"
        >
          {loading
            ? "Please wait..."
            : registerMode
            ? "Create account"
            : "Sign in"}
        </button>

        <button
          onClick={() => setRegisterMode(!registerMode)}
          className="w-full text-sm text-blue-600"
        >
          {registerMode
            ? "Already have an account? Sign in"
            : "Create a new account"}
        </button>

      </div>
    </div>
  );
}