import { useState } from "react";
import { signUpUser, loginUser } from "../services/authService";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUpUser(email, password, name);
        alert("Account Created Successfully!");
      } else {
        await loginUser(email, password);
        alert("Logged in Successfully!");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p style={styles.subtitle}>
          {isSignUp
            ? "Join us and start your journey"
            : "Login to continue"}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.primaryBtn}>
            {isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={styles.switchBtn}
        >
          {isSignUp
            ? "Already have an account? Login"
            : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Segoe UI, sans-serif",
  },
  card: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  title: {
    marginBottom: "8px",
    fontSize: "24px",
    fontWeight: "600",
    color: "#2d3748",
  },
  subtitle: {
    marginBottom: "25px",
    color: "#718096",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e0",
    fontSize: "14px",
    outline: "none",
  },
  primaryBtn: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#667eea",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  switchBtn: {
    marginTop: "18px",
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
    cursor: "pointer",
  },
};