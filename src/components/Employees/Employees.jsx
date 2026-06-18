import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import "./Employees.css";

const ROLE_LABELS = {
  owner: "Owner",
  restaurant_manager: "Restaurant Manager",
  floor_manager: "Floor Manager",
  server: "Server",
  kitchen: "Kitchen Display",
  auditor: "Auditor"
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("server");
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch employees from database
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("joined_date", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.is_active).length;
    const managers = employees.filter(e => ["restaurant_manager", "floor_manager"].includes(e.role)).length;
    const servers = employees.filter(e => e.role === "server").length;
    return { total, active, managers, servers };
  }, [employees]);

  // Toggle status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Employee status ${!currentStatus ? "activated" : "deactivated"}`);
      setEmployees(prev => 
        prev.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e)
      );
    } catch (err) {
      console.error("Error toggling status:", err);
      toast.error("Failed to update status.");
    }
  };

  // Delete employee
  const handleDelete = async (id, empName) => {
    if (!window.confirm(`Are you sure you want to delete ${empName}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Employee removed successfully");
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast.error("Failed to remove employee.");
    }
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("server");
    setJoinedDate(new Date().toISOString().split("T")[0]);
    setPassword("");
    setPin("");
    setPhone("");
    setSection("");
  };

  // Add employee submit
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in Name, Email, and Password.");
      return;
    }

    if (["floor_manager", "server", "kitchen"].includes(role) && pin && !/^\d{4}$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }

    setSubmitting(true);
    try {
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingEmail) {
        toast.error("An account with this email already exists.");
        setSubmitting(false);
        return;
      }

      const newEmp = {
        name,
        email,
        role,
        joined_date: joinedDate || new Date().toISOString().split("T")[0],
        password_hash: password, // Store password
        pin: pin || null,
        phone: phone || null,
        section: role === "server" && section ? section : null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("users")
        .insert([newEmp])
        .select();

      if (error) throw error;

      toast.success(`${name} added as ${ROLE_LABELS[role]}`);
      setShowAddModal(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      console.error("Error adding employee:", err);
      toast.error(err.message || "Failed to add employee.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employeesTab">
      <div className="employeesHeaderRow">
        <div className="employeesTitleWrap">
          <h2>Employee Directory</h2>
          <p>Create and manage restaurant staff access credentials, roles, and status.</p>
        </div>
        
        <button className="btnPrimary" onClick={() => setShowAddModal(true)}>
          <span>+</span> Add New Employee
        </button>
      </div>

      {/* Stats row */}
      <div className="employeesStatsGrid">
        <div className="empStatCard">
          <div className="empStatIcon">👥</div>
          <div className="empStatInfo">
            <span>Total Staff</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
        <div className="empStatCard">
          <div className="empStatIcon">🟢</div>
          <div className="empStatInfo">
            <span>Active Shifts</span>
            <strong>{stats.active}</strong>
          </div>
        </div>
        <div className="empStatCard">
          <div className="empStatIcon">📋</div>
          <div className="empStatInfo">
            <span>Managers</span>
            <strong>{stats.managers}</strong>
          </div>
        </div>
        <div className="empStatCard">
          <div className="empStatIcon">🍽</div>
          <div className="empStatInfo">
            <span>Floor Servers</span>
            <strong>{stats.servers}</strong>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="employeesTableCard">
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#8C7B6A" }}>
            Loading Employee Directory...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#8C7B6A" }}>
            No employees found in the directory.
          </div>
        ) : (
          <div className="employeesTableWrapper">
            <table className="employeesTable">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Date of Joining</th>
                  <th>PIN / Login</th>
                  <th>Assigned Section</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="empProfile">
                        <div className="empAvatar">
                          {emp.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <div className="empNameInfo">
                          <strong>{emp.name}</strong>
                          <small>{emp.email || "No email provided"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`roleBadge role-${emp.role}`}>
                        {ROLE_LABELS[emp.role] || emp.role}
                      </span>
                    </td>
                    <td>
                      {emp.joined_date ? new Date(emp.joined_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      }) : "—"}
                    </td>
                    <td>
                      {emp.pin ? (
                        <code style={{ background: "rgba(0,0,0,0.05)", padding: "0.2rem 0.4rem", borderRadius: "2px" }}>
                          PIN: {emp.pin}
                        </code>
                      ) : emp.password_hash ? (
                        <small style={{ color: "#8C7B6A" }}>Password Protected</small>
                      ) : (
                        <span style={{ color: "#C8C0B8" }}>—</span>
                      )}
                    </td>
                    <td>
                      {emp.section ? (
                        <span style={{ textTransform: "capitalize" }}>{emp.section}</span>
                      ) : (
                        <span style={{ color: "#C8C0B8" }}>—</span>
                      )}
                    </td>
                    <td>
                      <label className="statusSwitch">
                        <input 
                          type="checkbox" 
                          checked={emp.is_active ?? true} 
                          onChange={() => handleToggleStatus(emp.id, emp.is_active ?? true)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="empActions">
                        <button 
                          className="btnAction delete" 
                          onClick={() => handleDelete(emp.id, emp.name)}
                          title="Remove Employee"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modalOverlay">
            <motion.div 
              className="modalCard"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="modalHeader">
                <h3>Add New Staff Member</h3>
                <button className="modalClose" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddEmployee}>
                <div className="modalBody">
                  <div className="formGrid">
                    <div className="formField formSpan2">
                      <label htmlFor="fullName">Full Name</label>
                      <input 
                        id="fullName"
                        type="text" 
                        className="formInput"
                        placeholder="e.g. Ramesh Kumar"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="formField formSpan2">
                      <label htmlFor="empEmail">Email Address</label>
                      <input 
                        id="empEmail"
                        type="email" 
                        className="formInput"
                        placeholder="e.g. ramesh@basquedehradun.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="formField">
                      <label htmlFor="empRole">Role Profile</label>
                      <select 
                        id="empRole"
                        className="formSelect"
                        value={role}
                        onChange={e => {
                          setRole(e.target.value);
                          if (e.target.value !== "server") setSection("");
                        }}
                      >
                        <option value="restaurant_manager">Restaurant Manager</option>
                        <option value="floor_manager">Floor Manager</option>
                        <option value="server">Server</option>
                        <option value="kitchen">Kitchen Display</option>
                        <option value="auditor">Auditor</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>

                    <div className="formField">
                      <label htmlFor="joinDate">Date of Joining</label>
                      <input 
                        id="joinDate"
                        type="date" 
                        className="formInput"
                        value={joinedDate}
                        onChange={e => setJoinedDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="formField formSpan2">
                      <label htmlFor="empPassword">Password (for Portal Login)</label>
                      <input 
                        id="empPassword"
                        type="password" 
                        className="formInput"
                        placeholder="Minimum 6 characters recommended"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {["floor_manager", "server", "kitchen"].includes(role) && (
                      <div className="formField">
                        <label htmlFor="empPin">4-Digit Login PIN</label>
                        <input 
                          id="empPin"
                          type="text" 
                          maxLength={4}
                          className="formInput"
                          placeholder="e.g. 1234"
                          value={pin}
                          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                        />
                        <span className="formFieldHint">Optional. Used for quick pin-pad login.</span>
                      </div>
                    )}

                    {role === "server" && (
                      <div className="formField">
                        <label htmlFor="assignedSec">Assigned Section</label>
                        <select 
                          id="assignedSec"
                          className="formSelect"
                          value={section}
                          onChange={e => setSection(e.target.value)}
                        >
                          <option value="">None / Floating</option>
                          <option value="indoor">Indoor</option>
                          <option value="terrace">Terrace</option>
                          <option value="garden">Garden</option>
                          <option value="bar">Bar</option>
                        </select>
                      </div>
                    )}

                    <div className="formField formSpan2">
                      <label htmlFor="empPhone">Phone Number</label>
                      <input 
                        id="empPhone"
                        type="text" 
                        className="formInput"
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="formActions">
                    <button 
                      type="button" 
                      className="btnSecondary" 
                      onClick={() => { setShowAddModal(false); resetForm(); }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btnPrimary" disabled={submitting}>
                      {submitting ? "Saving Staff..." : "Save Employee"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
