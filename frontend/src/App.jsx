import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000";

export default function App() {
  const [tab, setTab] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [stores, setStores] = useState([]);

  useEffect(() => {
    if (token) fetchStores();
  }, [token]);

  const fetchStores = async () => {
    try {
      const res = await axios.get(`${API}/stores`);
      setStores(res.data.stores || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔐 AUTH SCREEN
  if (!token) {
    return (
      <div className="page">
        <div className="card">
          <h2>Store Rating System ⭐</h2>
          <p className="subtitle">Rate & review stores easily</p>

          <div className="tabs">
            <button
              onClick={() => setTab("login")}
              className={tab === "login" ? "active" : ""}
            >
              Login
            </button>
            <button
              onClick={() => setTab("signup")}
              className={tab === "signup" ? "active" : ""}
            >
              Signup
            </button>
          </div>

          {tab === "login" ? (
            <Login setToken={setToken} />
          ) : (
            <Signup setTab={setTab} />
          )}
        </div>
      </div>
    );
  }

  // 🏬 STORE SCREEN
  return (
    <div className="page">
      <div className="card">
        <div className="top">
          <div>
            <h2>Stores 🏬</h2>
            <p className="subtitle">Rate your favourite stores</p>
          </div>

          <button
            className="logout"
            onClick={() => {
              localStorage.removeItem("token");
              setToken(null);
            }}
          >
            Logout
          </button>
        </div>

        <div className="store-list">
          {stores.length === 0 ? (
            <p className="empty">No stores available</p>
          ) : (
            stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                token={token}
                refresh={fetchStores}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    try {
      const res = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button>Login</button>
    </form>
  );
}

function Signup({ setTab }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
  });

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.address) {
      alert("All fields required");
      return;
    }

    try {
      await axios.post(`${API}/auth/signup`, form);
      alert("Signup success. Please login.");
      setTab("login"); // auto switch
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <input
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <button>Signup</button>
    </form>
  );
}

function StoreCard({ store, token, refresh }) {
  const [rating, setRating] = useState("");

  const submitRating = async () => {
    if (!rating || rating < 1 || rating > 5) {
      alert("Enter rating 1–5");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/ratings",
        { storeId: store.id, value: Number(rating) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Rating submitted ⭐");
      setRating("");
      refresh();
    } catch (err) {
      alert(err.response?.data?.error || "Rating failed");
    }
  };

  return (
    <div className="store">
      <div className="store-header">
        <h3>{store.name}</h3>
        <span className="rating-badge">⭐ {store.averageRating}</span>
      </div>

      <p className="address">{store.address}</p>

      <div className="rate">
        <input
          placeholder="Rate 1–5"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
        <button onClick={submitRating}>Rate</button>
      </div>
    </div>
  );
}

