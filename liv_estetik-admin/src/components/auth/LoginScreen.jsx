import { useState } from "react";
import { motion } from "framer-motion";
import { login } from "../../api";
import { Field, TextInput, PrimaryButton } from "../ui/Controls";
import { FiEye, FiEyeOff } from "react-icons/fi";

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
    <main className="min-h-screen bg-luxury-radial flex flex-col items-center px-4 py-8">
      {/* Logo */}
      <motion.img
        src="/image/logo_liv-removebg-preview.png"
        alt="Liv Estetik"
        className="w-40 h-auto mb-10"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      />

      {/* Center Form */}
      <div className="flex-1 flex items-start justify-center w-full pt-12">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-xl border border-champagne-300/20 bg-white p-8 text-stone-900 shadow-2xl"
        >
          <div className="space-y-4">
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
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          password: e.target.value,
        }))
      }
      className="pr-12"
      required
    />

    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
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
            className="mt-6 w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </PrimaryButton>
        </motion.form>
      </div>
    </main>
  );
}

