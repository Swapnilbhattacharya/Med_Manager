import React, { useState } from "react";
import { signUpUser, loginUser } from "../services/authService";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState(""); // New State
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Mobile Validation (E.164 format: + followed by 7-15 digits)
    const mobileRegex = /^\+[1-9]\d{6,14}$/;
    if (isSignUp && !mobileRegex.test(mobile)) {
      alert("Please enter a valid mobile number with country code (e.g., +1234567890)");
      return;
    }

    // 2. Password Confirmation Logic
    if (isSignUp && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      if (isSignUp) {
        // Pass mobile to your signUpUser service
        await signUpUser(email, password, name, mobile);
        alert("Account Created Successfully!");
      } else {
        await loginUser(email, password);
      }
      window.location.href = "/";
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back"}</h2>
        <p style={styles.subtitle}>
          {isSignUp ? "Join us and start managing your household meds" : "Login to check your daily schedule"}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
              {/* New Mobile Field */}
              <input
                type="tel"
                placeholder="Mobile (+91...)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                style={styles.input}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...styles.input, width: "100%", paddingRight: "40px" }}
            />
            <span onClick={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </span>
          </div>

          {isSignUp && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
            />
          )}

          <button type="submit" style={styles.primaryBtn}>
            {isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setConfirmPassword("");
            setPassword("");
            setMobile(""); // Clear mobile on switch
            setShowPassword(false);
          }}
          style={styles.switchBtn}
        >
          {isSignUp ? "Already have an account? Login" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  // ... (keep your existing styles as they are)
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Segoe UI', Roboto, sans-serif" },
  card: { background: "#ffffff", padding: "35px", borderRadius: "16px", width: "90%", maxWidth: "400px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", textAlign: "center" },
  title: { marginBottom: "8px", fontSize: "26px", fontWeight: "700", color: "#1a202c" },
  subtitle: { marginBottom: "25px", color: "#4a5568", fontSize: "14px", lineHeight: "1.5" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: { padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "15px", outline: "none", transition: "border 0.2s", boxSizing: "border-box" },
  passwordWrapper: { position: "relative", display: "flex", alignItems: "center", width: "100%" },
  eyeIcon: { position: "absolute", right: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  primaryBtn: { marginTop: "10px", padding: "14px", borderRadius: "10px", border: "none", background: "#667eea", color: "#fff", fontSize: "16px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 6px rgba(102, 126, 234, 0.3)" },
  switchBtn: { marginTop: "20px", background: "none", border: "none", color: "#667eea", fontSize: "14px", fontWeight: "500", cursor: "pointer" },
};