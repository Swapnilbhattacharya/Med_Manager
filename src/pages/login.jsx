import React, { useState } from "react";
import { signUpUser, loginUser } from "../services/authService";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false); // Default to login view
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // Uses the new signUpUser which creates the Firestore profile
        await signUpUser(email, password, name);
        alert("Account Created Successfully!");
      } else {
        await loginUser(email, password);
      }

      /**
       * NATIVE NAVIGATION: 
       * Since we aren't using React Router, window.location.href 
       * forces a refresh to the dashboard, ensuring the App state reloads.
       */
      window.location.href = "/"; 

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
            ? "Join us and start managing your household meds"
            : "Login to check your daily schedule"}
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
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  card: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  title: {
    marginBottom: "8px",
    fontSize: "26px",
    fontWeight: "700",
    color: "#1a202c",
  },
  subtitle: {
    marginBottom: "25px",
    color: "#4a5568",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    outline: "none",
    transition: "border 0.2s",
  },
  primaryBtn: {
    marginTop: "10px",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#667eea",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(102, 126, 234, 0.3)",
  },
  switchBtn: {
    marginTop: "20px",
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
};