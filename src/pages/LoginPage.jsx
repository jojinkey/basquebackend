import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./LoginPage.css";

const DEMO_USERS = [
  { role: "owner",              name: "Jalaj",   credential: "owner@2024", inputType: "password" },
  { role: "restaurant_manager", name: "Arjun",   credential: "manager@24", inputType: "password" },
  { role: "floor_manager",      name: "Priya",   credential: "4455",       inputType: "pin" },
  { role: "server",             name: "Rahul",   credential: "1122",       inputType: "pin" },
  { role: "kitchen",            name: "Kitchen", credential: "7788",       inputType: "pin" },
  { role: "auditor",            name: "Audit",   credential: "audit@26",   inputType: "password" },
];

const ROLES = [
  { value: "owner",              label: "Owner",               inputType: "password", placeholder: "Password" },
  { value: "restaurant_manager", label: "Restaurant Manager",  inputType: "password", placeholder: "Password" },
  { value: "floor_manager",      label: "Floor Manager",       inputType: "pin",      placeholder: "4-Digit PIN" },
  { value: "server",             label: "Server",              inputType: "pin",      placeholder: "4-Digit PIN" },
  { value: "kitchen",            label: "Kitchen Display",     inputType: "pin",      placeholder: "4-Digit PIN" },
  { value: "auditor",            label: "Auditor",             inputType: "password", placeholder: "Password" },
];

const PIN_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

function getService() {
  const h = new Date().getHours();
  if (h >= 7 && h < 12) return "BREAKFAST";
  if (h >= 12 && h < 16) return "LUNCH";
  if (h >= 16 && h < 19) return "HIGH TEA";
  return "DINNER";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState("");
  const [credential, setCredential] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const handleResetDemo = async () => {
    if (!window.confirm("Reset all demo data to the default state?\n\nThis will clear current orders, sessions, and waitlist — and restore the demo scenario. Real reservations from the website will be kept.")) return;
    setResetting(true);
    setResetMsg("");
    try {
      const { error: fnError } = await supabase.rpc("reset_demo_data");
      if (fnError) throw fnError;
      setResetMsg("Demo data reset successfully.");
    } catch (e) {
      setResetMsg("Reset failed: " + (e.message || "unknown error"));
    } finally {
      setResetting(false);
      setTimeout(() => setResetMsg(""), 4000);
    }
  };

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const roleConfig = ROLES.find((r) => r.value === selectedRole);

  const handlePinPress = (digit) => {
    if (digit === "⌫") {
      setCredential((p) => p.slice(0, -1));
    } else if (digit !== "" && credential.length < 4) {
      setCredential((p) => p + digit);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedRole) { setError("Please select your role"); return; }
    if (!credential) { setError("Please enter your credential"); return; }

    setLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 600));

    const match = DEMO_USERS.find(
      (u) => u.role === selectedRole && u.credential === credential
    );

    if (match) {
      login({ id: `demo_${match.role}`, name: match.name, role: match.role });
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="loginBg">
      <div className="grainOverlay" />

      <motion.div
        className="loginCard"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="loginBrand">
          <p className="loginBrandName">B A S Q U E</p>
          <p className="loginBrandSub">MANAGER  OS</p>
        </div>

        <div className="ornamentDivider">
          <span className="ornDot" />
          <span className="ornLine" />
          <span className="ornDot" />
          <span className="ornLine" />
          <span className="ornDot" />
        </div>

        <form onSubmit={handleSubmit} className="loginForm">
          <div className="loginField">
            <label className="loginLabel">SELECT ROLE</label>
            <select
              className="loginSelect"
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setCredential(""); setError(""); }}
            >
              <option value="">— Choose your role —</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {selectedRole && roleConfig?.inputType === "pin" ? (
            <div className="loginField">
              <label className="loginLabel">ENTER PIN</label>
              <div className="pinDisplay">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`pinDot ${credential[i] ? "filled" : ""}`} />
                ))}
              </div>
              <div className="pinPad">
                {PIN_DIGITS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pinKey ${d === "" ? "pinEmpty" : ""} ${d === "⌫" ? "pinBack" : ""}`}
                    onClick={() => d !== "" && handlePinPress(d)}
                    disabled={d === ""}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ) : selectedRole ? (
            <div className="loginField">
              <label className="loginLabel">PASSWORD</label>
              <div className="passInputWrap">
                <input
                  type={showPass ? "text" : "password"}
                  className="loginInput"
                  placeholder={roleConfig?.placeholder}
                  value={credential}
                  onChange={(e) => { setCredential(e.target.value); setError(""); }}
                  autoComplete="current-password"
                />
                <button type="button" className="showPassBtn" onClick={() => setShowPass((p) => !p)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ) : null}

          {error && <p className="loginError">{error}</p>}

          <button
            type="submit"
            className="loginSubmit"
            disabled={loading || !selectedRole || !credential}
          >
            {loading ? "VERIFYING..." : "ENTER SERVICE →"}
          </button>
        </form>

        <div className="loginMeta">
          <p className="loginService">Current Service: {getService()}</p>
          <p className="loginDate">{formatDate()}</p>
        </div>

        <div className="loginResetRow">
          <button
            type="button"
            className="resetDemoBtn"
            onClick={handleResetDemo}
            disabled={resetting}
          >
            {resetting ? "Resetting…" : "↺ Reset Demo Data"}
          </button>
          {resetMsg && <p className="resetMsg">{resetMsg}</p>}
        </div>
      </motion.div>
    </div>
  );
}
