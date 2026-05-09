import { useState } from "react";
import api from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";

function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isRegistering ? "/auth/register" : "/auth/login";
    const payload = isRegistering
      ? { name: username, username, password }
      : { username, password };

    try {
      const res = await api.post(endpoint, payload);

      if (!isRegistering) {
        localStorage.setItem("token", res.data.token);
        setIsLoggedIn(true);
        navigate("/dashboard");
      } else {
        alert("Registration successful! Please login.");
        setIsRegistering(false);
      }
    } catch (err) {
      alert(isRegistering ? "Registration failed" : "Login failed");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background: "#dff1ff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial",
      }}
    >
      <div style={{ background: "white", padding: 30, borderRadius: 10, width: 350 }}>
        <h2 style={{ textAlign: "center" }}>FreshTrack</h2>
        <p style={{ textAlign: "center" }}>Inventory System</p>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          <button
            style={{
              width: "100%",
              padding: 10,
              background: "blue",
              color: "white",
              border: "none",
            }}
          >
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>

        <button onClick={() => setIsRegistering(!isRegistering)} style={{ marginTop: 10 }}>
          {isRegistering ? "Back to Login" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

export default Login;

