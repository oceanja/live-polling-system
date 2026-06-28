import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, type Role } from "../../auth/AuthContext";
import { apiError } from "../../api/client";
import { ChunkyButton, popIn, spring } from "../../ui/playful";
import { Field } from "./LoginPage";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({ name, email, password, role });
      navigate(user.role === "TEACHER" ? "/teacher" : "/student");
    } catch (err) {
      setError(apiError(err, "Registration failed"));
      setLoading(false);
    }
  };

  const roles: { id: Role; label: string; blurb: string; bg: string }[] = [
    { id: "STUDENT", label: "Student", blurb: "Join & answer", bg: "#4ECDC4" },
    { id: "TEACHER", label: "Teacher", blurb: "Run sessions", bg: "#FF6B6B" },
  ];

  return (
    <div className="min-h-screen w-full bg-cream flex items-center justify-center p-6">
      <motion.form
        onSubmit={handleSubmit}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="w-full max-w-md text-center"
      >
        <motion.h1 variants={popIn} className="font-fredoka font-bold text-charcoal text-4xl mb-2">
          Create your account
        </motion.h1>
        <motion.p variants={popIn} className="font-nunito text-charcoal/60 mb-8">
          Pick a role to get started.
        </motion.p>

        <motion.div variants={popIn} className="bg-white rounded-3xl p-7 text-left flex flex-col gap-4" style={{ boxShadow: "0 8px 0 0 #E2E8F0" }}>
          {error && (
            <div className="bg-coral/10 text-coral font-nunito font-semibold rounded-xl px-4 py-3 text-sm text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => {
              const active = role === r.id;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  whileTap={{ scale: 0.96 }}
                  transition={spring}
                  className="rounded-2xl p-4 border-[3px] cursor-pointer bg-white text-left"
                  style={{ borderColor: active ? r.bg : "#E2E8F0" }}
                >
                  <div className="w-4 h-4 rounded-full mb-2" style={{ background: r.bg }} />
                  <div className="font-fredoka font-bold text-charcoal">{r.label}</div>
                  <div className="font-nunito text-charcoal/50 text-sm">{r.blurb}</div>
                </motion.button>
              );
            })}
          </div>

          <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />

          <ChunkyButton type="submit" disabled={loading} bg="#7C5CFC" shadow="#5b3fd6" className="w-full mt-2">
            {loading ? "Creating…" : "Create account"}
          </ChunkyButton>
        </motion.div>

        <motion.p variants={popIn} className="font-nunito text-charcoal/60 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-sky font-bold hover:underline">
            Log in
          </Link>
        </motion.p>
      </motion.form>
    </div>
  );
}
