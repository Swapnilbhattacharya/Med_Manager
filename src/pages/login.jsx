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
        alert("Account Created!");
      } else {
        await loginUser(email, password);
        alert("Logged in!");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "50px auto", textAlign: "center" }}>
      <h2>{isSignUp ? "Join Family" : "Login"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {isSignUp && (
          <input 
            type="text" placeholder="Your Name" value={name} 
            onChange={(e) => setName(e.target.value)} required 
          />
        )}
        
        <input 
          type="email" placeholder="Email" value={email} 
          onChange={(e) => setEmail(e.target.value)} required 
        />
        
        <input 
          type="password" placeholder="Password" value={password} 
          onChange={(e) => setPassword(e.target.value)} required 
        />
        
        <button type="submit">{isSignUp ? "Sign Up" : "Login"}</button>
      </form>

      <button onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: "10px", background: "none", border: "none", color: "blue", cursor: "pointer" }}>
        {isSignUp ? "Have an account? Login" : "New here? Sign Up"}
      </button>
    </div>
  );
}