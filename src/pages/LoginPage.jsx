import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import "./LoginPage.css";

const DEMO_USERS = [
  { role: "owner",              name: "Avantika", credential: "owner@2024", inputType: "password", label: "Owner", icon: "👑", desc: "Full access · God View · Settings" },
  { role: "restaurant_manager", name: "Arjun",   credential: "manager@24", inputType: "password", label: "Restaurant Manager", icon: "📋", desc: "Floor · Kitchen · Pipeline · Insights" },
  { role: "floor_manager",      name: "Priya",   credential: "4455",       inputType: "pin", label: "Floor Manager", icon: "🏛", desc: "Floor Plan · Waitlist · Alerts" },
  { role: "server",             name: "Rahul",   credential: "1122",       inputType: "pin", label: "Server", icon: "🍽", desc: "Tables · Orders · Alerts" },
  { role: "kitchen",            name: "Kitchen", credential: "7788",       inputType: "pin", label: "Kitchen Display", icon: "🍳", desc: "Order queue · Menu availability" },
  { role: "auditor",            name: "Audit",   credential: "audit@26",   inputType: "password", label: "Auditor", icon: "📊", desc: "Financial reports · Exports" },
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
  const [loginMode, setLoginMode] = useState("role"); // "role" or "email"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleQuickLogin = async (demoUser) => {
    setLoading(true);
    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("role", demoUser.role)
        .eq("name", demoUser.name)
        .eq("is_active", true)
        .maybeSingle();

      const userId = dbUser?.id || `demo_${demoUser.role}`;
      login({ id: userId, name: demoUser.name, role: demoUser.role });
      navigate("/dashboard");
    } catch (e) {
      console.error("Quick login resolution failed, falling back:", e);
      login({ id: `demo_${demoUser.role}`, name: demoUser.name, role: demoUser.role });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

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
    setLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 600));

    try {
      if (loginMode === "email") {
        if (!email) { setError("Please enter your email"); setLoading(false); return; }
        if (!password) { setError("Please enter your password"); setLoading(false); return; }

        // Query database
        const { data: dbUser, error: dbErr } = await supabase
          .from("users")
          .select("*")
          .eq("email", email.trim().toLowerCase())
          .eq("is_active", true)
          .maybeSingle();

        if (dbErr) throw dbErr;

        // Verify password (plain text match)
        const isMatch = dbUser && (
          dbUser.password_hash === password ||
          (dbUser.role === "owner" && password === "owner@2024") ||
          (dbUser.role === "restaurant_manager" && password === "manager@24") ||
          (dbUser.role === "auditor" && password === "audit@26")
        );

        if (isMatch) {
          login({ id: dbUser.id, name: dbUser.name, role: dbUser.role });
          navigate("/dashboard");
          setLoading(false);
          return;
        }

        // Fallback to static demo users by email lookup
        const demoMatch = DEMO_USERS.find(
          (u) => (u.role === "owner" && email.trim().toLowerCase().includes("owner") && password === "owner@2024") ||
                 (u.role === "restaurant_manager" && email.trim().toLowerCase().includes("manager") && password === "manager@24") ||
                 (u.role === "auditor" && email.trim().toLowerCase().includes("audit") && password === "audit@26")
        );

        if (demoMatch) {
          login({ id: `demo_${demoMatch.role}`, name: demoMatch.name, role: demoMatch.role });
          navigate("/dashboard");
        } else {
          setError("Invalid email or password. Please try again.");
        }
      } else {
        // Role-based login
        if (!selectedRole) { setError("Please select your role"); setLoading(false); return; }
        if (!credential) { setError("Please enter your credential"); setLoading(false); return; }

        // First, check database users
        const { data: dbUsers, error: dbErr } = await supabase
          .from("users")
          .select("*")
          .eq("role", selectedRole)
          .eq("is_active", true);

        if (dbErr) throw dbErr;

        const inputType = roleConfig?.inputType || "password";

        let dbUserMatch = null;
        if (dbUsers && dbUsers.length > 0) {
          dbUserMatch = dbUsers.find((u) => {
            if (inputType === "pin") {
              return u.pin === credential;
            } else {
              return u.password_hash === credential || 
                     (u.role === "owner" && credential === "owner@2024") ||
                     (u.role === "restaurant_manager" && credential === "manager@24") ||
                     (u.role === "auditor" && credential === "audit@26");
            }
          });
        }

        if (dbUserMatch) {
          login({ id: dbUserMatch.id, name: dbUserMatch.name, role: dbUserMatch.role });
          navigate("/dashboard");
          setLoading(false);
          return;
        }

        // Fallback to static demo users
        const demoMatch = DEMO_USERS.find(
          (u) => u.role === selectedRole && u.credential === credential
        );

        if (demoMatch) {
          login({ id: `demo_${demoMatch.role}`, name: demoMatch.name, role: demoMatch.role });
          navigate("/dashboard");
        } else {
          setError("Invalid credentials. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Login service error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginBg">
      <div className="grainOverlay" />
      <div className="bgGlow bgGlow1" />
      <div className="bgGlow bgGlow2" />

      <motion.div
        className="loginCard"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Luxury corner ornaments */}
        <div className="cardCorner corner-tl" />
        <div className="cardCorner corner-tr" />
        <div className="cardCorner corner-bl" />
        <div className="cardCorner corner-br" />

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

        {/* ── 1-Click Demo Logins ── */}
        <div className="quickLoginSection">
          <p className="quickLoginLabel">QUICK ACCESS</p>
          <div className="quickLoginGrid">
            {DEMO_USERS.map((u) => (
              <motion.button
                key={u.role}
                type="button"
                className="quickLoginBtn"
                onClick={() => handleQuickLogin(u)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="qlIconContainer">
                  <span className="qlIcon">{u.icon}</span>
                </div>
                <span className="qlName">{u.name}</span>
                <span className="qlRole">{u.label}</span>
                <span className="qlDesc">{u.desc}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="loginDividerRow">
          <span className="loginDividerLine" />
          <span className="loginDividerText">OR ENTER CREDENTIALS</span>
          <span className="loginDividerLine" />
        </div>

        <div className="loginModeToggle" style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', margin: '0 0 1.5rem 0' }}>
          <button
            type="button"
            className="resetDemoBtn"
            style={loginMode === 'role' ? { background: 'rgba(200, 133, 42, 0.1)', borderColor: '#C8852A', color: '#C8852A' } : {}}
            onClick={() => { setLoginMode('role'); setError(''); setCredential(''); setEmail(''); setPassword(''); }}
          >
            Role & PIN Pad
          </button>
          <button
            type="button"
            className="resetDemoBtn"
            style={loginMode === 'email' ? { background: 'rgba(200, 133, 42, 0.1)', borderColor: '#C8852A', color: '#C8852A' } : {}}
            onClick={() => { setLoginMode('email'); setError(''); setCredential(''); setEmail(''); setPassword(''); }}
          >
            Email & Password
          </button>
        </div>

        <form onSubmit={handleSubmit} className="loginForm">
          {loginMode === "email" ? (
            <>
              <div className="loginField">
                <label className="loginLabel" htmlFor="loginEmail">EMAIL ADDRESS</label>
                <input
                  id="loginEmail"
                  type="email"
                  className="loginInput"
                  placeholder="name@basquedehradun.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="loginField">
                <label className="loginLabel" htmlFor="loginPassword">PASSWORD</label>
                <div className="passInputWrap">
                  <input
                    id="loginPassword"
                    type={showPass ? "text" : "password"}
                    className="loginInput"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="showPassBtn" onClick={() => setShowPass((p) => !p)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="loginField">
                <label className="loginLabel" htmlFor="loginRoleSelect">SELECT ROLE</label>
                <select
                  id="loginRoleSelect"
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
                  <label className="loginLabel" htmlFor="loginRolePassword">PASSWORD</label>
                  <div className="passInputWrap">
                    <input
                      id="loginRolePassword"
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
            </>
          )}

          {error && <p className="loginError">{error}</p>}

          <button
            type="submit"
            className="loginSubmit"
            disabled={loading || (loginMode === "email" ? (!email || !password) : (!selectedRole || !credential))}
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
