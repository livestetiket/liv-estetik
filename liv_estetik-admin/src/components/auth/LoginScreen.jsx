import { useState } from "react";
import { motion } from "framer-motion";
import { login } from "../../api";
import { Field, TextInput, PrimaryButton } from "../ui/Controls";
import { FiEye, FiEyeOff } from "react-icons/fi";
import BrandLogo from "../BrandLogo";

export default function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(form.email, form.password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="staff-login min-h-screen px-4 py-8 sm:px-6 lg:grid lg:place-items-center">
      <div className="staff-login-grid mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl lg:grid-cols-[1fr_0.9fr]">
        <div className="staff-login-aside flex flex-col justify-between p-8 sm:p-10 lg:min-h-[38rem]">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <BrandLogo className="staff-login-logo" />
          </motion.div>
          <div className="my-10 max-w-md lg:my-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-champagne-700">Staff workspace</p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-evergreen-950 sm:text-5xl">Welcome back to considered care.</h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-stone-600">Sign in to manage appointments, patient follow-up, and clinic operations.</p>
          </div>
          <p className="text-xs text-stone-500">Secure access for Liv Estetik staff</p>
        </div>

        <div className="flex items-center border-t border-stone-200 p-6 sm:p-10 lg:border-l lg:border-t-0">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full rounded-xl bg-white text-stone-900"
        >
          <div className="mb-7">
            <h2 className="font-display text-3xl font-semibold text-evergreen-950">Staff sign in</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">Use your clinic email and password. Your account determines your access level.</p>
          </div>
          <div className="space-y-5">
            <Field label="Email">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <TextInput
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-stone-500 hover:text-stone-700"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </Field>
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <PrimaryButton
            disabled={loading}
            className="mt-7 w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </PrimaryButton>
        </motion.form>
      </div>
      </div>
    </main>
  );
}

