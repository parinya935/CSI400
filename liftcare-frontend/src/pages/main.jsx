// src/pages/main.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

export default function Main() {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [jobs, setJobs] = useState([]);
  const [plans, setPlans] = useState([]);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [cst, bld, elv, tech, mj, mp] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/buildings"),
        api.get("/api/elevators"),
        api.get("/api/technicians"),
        api.get("/api/maintenance/jobs"),
        api.get("/api/maintenance/plans"),
      ]);

      setCustomers(cst || []);
      setBuildings(bld || []);
      setElevators(elv || []);
      setTechnicians(tech || []);
      setJobs(mj || []);
      setPlans(mp || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // ---- helper สำหรับ PM รอบถัดไป ----
  const upcomingPlans = (() => {
    const active = plans.filter((p) => p.is_active !== 0 && p.next_run_at);
    return active
      .slice()
      .sort((a, b) => {
        const da = new Date(a.next_run_at);
        const db = new Date(b.next_run_at);
        return da - db;
      })
      .slice(0, 5);
  })();

  const recentJobs = (() => {
    const clone = jobs.slice();
    clone.sort((a, b) => {
      // ถ้ามี created_at ใช้ created_at, ถ้าไม่มีก็ใช้ id
      if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return (b.id || 0) - (a.id || 0);
    });
    return clone.slice(0, 5);
  })();

  // ---- สถิติรวม ----
  const stats = {
    customers: customers.length,
    buildings: buildings.length,
    elevators: elevators.length,
    technicians: technicians.length,
    jobsTotal: jobs.length,
    plansTotal: plans.length,
    upcomingPm: upcomingPlans.length,
  };

  // ---- UI style ----
  const wrapperStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const cardsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  };

  const card = {
    background: "#FFFFFF",
    borderRadius: 6,
    border: "1px solid #D3D3D3",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    padding: 12,
  };

  const cardTitle = {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#808080",
    marginBottom: 6,
  };

  const cardNumber = {
    fontSize: 22,
    fontWeight: "600",
    color: "#003366",
  };

  const sectionTitle = {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#003366",
  };

  const tableCard = {
    ...card,
    marginTop: 8,
  };

  // ---- Helper: สร้าง status จาก timestamps ของ maintenance_jobs ----
  function getJobStatus(job) {
    const hasFinished = !!job.finished_at;
    const hasStarted = !!job.started_at;

    if (hasFinished) return "done";
    if (hasStarted) return "in_progress";
    return "pending";
  }

  function renderJobStatus(job) {
    const status = getJobStatus(job);

    if (status === "done") {
      return <span className="badge badge-status-done">Done</span>;
    }
    if (status === "in_progress") {
      return <span className="badge badge-status-inprogress">In progress</span>;
    }
    // default = pending
    return <span className="badge badge-status-pending">Pending</span>;
  }

  // ---- Helper: สถานะของ PM Plan จาก next_run_at ----
  function getPlanStatus(plan) {
    if (!plan.next_run_at) return "no_schedule";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = new Date(plan.next_run_at);
    next.setHours(0, 0, 0, 0);

    const diffDays = (next - today) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "upcoming";
    return "scheduled";
  }

  function renderPlanStatus(plan) {
    const status = getPlanStatus(plan);

    if (status === "overdue") {
      return <span className="badge badge-pm-overdue">Overdue</span>;
    }
    if (status === "upcoming") {
      return <span className="badge badge-pm-upcoming">Upcoming</span>;
    }
    if (status === "scheduled") {
      return <span className="badge badge-pm-scheduled">Scheduled</span>;
    }

    return <span className="badge badge-pm-scheduled">No schedule</span>;
  }

  return (
    <div className="dashboard">
      {/* หัว Dashboard */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard</h2>
        <p className="dashboard-subtitle">
          ภาพรวมลูกค้า สัญญา ลิฟต์ และงานบำรุงรักษาทั้งหมด
        </p>
      </div>

      {loading && <div>Loading dashboard...</div>}

      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <>
          {/* แถวที่ 1: สถิติหลัก */}
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-title">Customers</div>
              <div className="stat-number">{stats.customers}</div>
              <div className="stat-hint">จำนวนลูกค้าทั้งหมด</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Buildings</div>
              <div className="stat-number">{stats.buildings}</div>
              <div className="stat-hint">อาคารที่ดูแลทั้งหมด</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Elevators</div>
              <div className="stat-number">{stats.elevators}</div>
              <div className="stat-hint">จำนวนลิฟต์ในระบบ</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Technicians</div>
              <div className="stat-number">{stats.technicians}</div>
              <div className="stat-hint">ช่างที่ลงทะเบียน</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Maintenance Jobs</div>
              <div className="stat-number">{stats.jobsTotal}</div>
              <div className="stat-hint">งานบำรุงทั้งหมด</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Maintenance Plans</div>
              <div className="stat-number">{stats.plansTotal}</div>
              <div className="stat-hint">แผน PM ที่ตั้งไว้</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Upcoming PM</div>
              <div className="stat-number">{stats.upcomingPm}</div>
              <div className="stat-hint">รอบ PM ที่ใกล้ถึง</div>
            </div>
          </div>

          {/* แถวที่ 2: งานซ่อม & แผน PM */}
          <div style={cardsGrid}>
            <div style={card}>
              <div style={cardTitle}>Maintenance Jobs</div>
              <div style={cardNumber}>{stats.jobsTotal}</div>
              <div style={{ fontSize: 12, color: "#808080", marginTop: 4 }}>
                งานซ่อม / ตรวจทั้งหมดที่บันทึกในระบบ
              </div>
            </div>

            <div style={card}>
              <div style={cardTitle}>Maintenance Plans</div>
              <div style={cardNumber}>{stats.plansTotal}</div>
              <div style={{ fontSize: 12, color: "#808080", marginTop: 4 }}>
                แผน PM ตามสัญญาที่กำหนดไว้
              </div>
            </div>

            <div style={card}>
              <div style={cardTitle}>Upcoming PM</div>
              <div style={cardNumber}>{stats.upcomingPm}</div>
              <div style={{ fontSize: 12, color: "#808080", marginTop: 4 }}>
                แผน PM ที่มีวันนัดตรวจถัดไป
              </div>
            </div>
          </div>

          {/* แถวที่ 3: ตาราง 2 ฝั่ง */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
              gap: 16,
              marginTop: 8,
              alignItems: "flex-start",
            }}
          >
            {/* ตารางงานซ่อมล่าสุด */}
            <div style={tableCard}>
              <div style={sectionTitle}>Recent Maintenance Jobs</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Elevator</th>
                    <th>Building</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((j) => (
                    <tr key={j.id}>
                      <td>{j.id}</td>
                      <td>
                        {j.elevator_id}{" "}
                        {j.elevator_name ? `- ${j.elevator_name}` : ""}
                      </td>
                      <td>{j.building_name || "-"}</td>
                      <td>{j.job_type || "-"}</td>
                      <td>{renderJobStatus(j)}</td>
                      <td>
                        {j.created_at
                          ? new Date(j.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {recentJobs.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        No maintenance jobs yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ตาราง PM รอบถัดไป */}
            <div style={tableCard}>
              <div style={sectionTitle}>Upcoming PM (Next Runs)</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Elevator</th>
                    <th>Next run</th>
                    <th>Status</th>
                    <th>Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPlans.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.elevator_id}{" "}
                        {p.elevator_name ? `- ${p.elevator_name}` : ""}
                      </td>
                      <td>
                        {p.next_run_at
                          ? new Date(p.next_run_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{renderPlanStatus(p)}</td>
                      <td>{p.contract_code || "-"}</td>
                    </tr>
                  ))}
                  {upcomingPlans.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center" }}>
                        No upcoming PM plans.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
