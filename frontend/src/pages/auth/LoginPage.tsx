import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthContext";
import { apiError } from "../../api/client";
import { ChunkyButton, popIn } from "../../ui/playful";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "TEACHER" ? "/teacher" : "/student");
    } catch (err) {
      setError(apiError(err, "Login failed"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream flex items-center justify-center p-6">
      <motion.form
        onSubmit={handleSubmit}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="w-full max-w-md text-center"
      >
        <motion.h1 variants={popIn} className="font-fredoka font-bold text-charcoal text-4xl mb-2">
          Welcome back
        </motion.h1>
        <motion.p variants={popIn} className="font-nunito text-charcoal/60 mb-8">
          Log in to run or join a live quiz session.
        </motion.p>

        <motion.div variants={popIn} className="bg-white rounded-3xl p-7 text-left flex flex-col gap-4" style={{ boxShadow: "0 8px 0 0 #E2E8F0" }}>
          {error && (
            <div className="bg-coral/10 text-coral font-nunito font-semibold rounded-xl px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          <ChunkyButton type="submit" disabled={loading} bg="#45B7D1" shadow="#379FB8" className="w-full mt-2">
            {loading ? "Logging in…" : "Log in"}
          </ChunkyButton>
        </motion.div>

        <motion.p variants={popIn} className="font-nunito text-charcoal/60 mt-6">
          New here?{" "}
          <Link to="/register" className="text-sky font-bold hover:underline">
            Create an account
          </Link>
        </motion.p>
      </motion.form>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-fredoka font-semibold text-charcoal text-sm">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1.5 font-nunito font-semibold text-charcoal bg-cream rounded-xl px-4 py-3 outline-none border-[3px] border-transparent focus:border-sky transition-colors placeholder:text-charcoal/30"
      />
    </label>
  );
}
