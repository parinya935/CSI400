import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

export default function TechnicianPortal() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [technicianData, setTechnicianData] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);
  const [allTechnicians, setAllTechnicians] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [parts, setParts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [maintenancePlans, setMaintenancePlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTechnicianPortal(technicianId = null) {
    try {
      setLoading(true);
      setError("");

      // ดึงข้อมูลช่างทั้งหมด (สำหรับ admin)
      let techs = [];
      try {
        techs = await api.get("/api/technicians");
        setAllTechnicians(techs || []);
      } catch (e) {
        console.warn("Could not fetch technicians list:", e);
      }

      // กำหนดช่างที่จะดูข้อมูล
      let targetTechId = technicianId;
      if (!targetTechId) {
        // ถ้าไม่มีการเลือก ให้ใช้ช่างของตัวเอง (สำหรับ technician) หรือช่างแรก (สำหรับ admin)
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (userRole === "technician") {
          const myTech = techs.find((t) => t.user_id === currentUser.id);
          if (myTech) {
            targetTechId = myTech.id;
            setSelectedTechnicianId(myTech.id);
            setTechnicianData(myTech);
          }
        } else if (userRole === "admin" && techs.length > 0) {
          // สำหรับ admin ถ้ายังไม่เลือก ให้เลือกช่างแรก
          targetTechId = techs[0].id;
          setSelectedTechnicianId(techs[0].id);
          setTechnicianData(techs[0]);
        }
      } else {
        // ถ้ามีการเลือกแล้ว ให้หาข้อมูลช่างที่เลือก
        const selectedTech = techs.find((t) => t.id === targetTechId);
        if (selectedTech) {
          setTechnicianData(selectedTech);
        }
      }

      // ดึงข้อมูลทั้งหมด
      const [
        jobsData,
        elevData,
        partsData,
        stocksData,
        plansData,
      ] = await Promise.all([
        api.get("/api/maintenance/jobs"),
        api.get("/api/elevators"),
        api.get("/api/parts"),
        api.get("/api/parts/stocks"),
        api.get("/api/maintenance/plans"),
      ]);

      // Filter ข้อมูลตามช่างที่เลือก (ถ้าเป็น admin และเลือกช่างแล้ว)
      if (targetTechId && userRole === "admin") {
        // Filter jobs ตาม technician_id
        const filteredJobs = (jobsData || []).filter(
          (job) => job.technician_id === targetTechId
        );
        setJobs(filteredJobs);

        // Filter elevators ที่ช่างคนนี้ทำงาน (จาก jobs)
        const elevatorIds = new Set(
          filteredJobs.map((job) => job.elevator_id).filter(Boolean)
        );
        const filteredElevators = (elevData || []).filter((e) =>
          elevatorIds.has(e.id)
        );
        setElevators(filteredElevators);

        // Filter maintenance plans ที่เกี่ยวข้องกับ elevators เหล่านี้
        const filteredPlans = (plansData || []).filter((p) =>
          elevatorIds.has(p.elevator_id)
        );
        setMaintenancePlans(filteredPlans);
      } else {
        // สำหรับ technician ปกติ หรือ admin ที่ยังไม่เลือก
        setJobs(jobsData || []);
        setElevators(elevData || []);
        setMaintenancePlans(plansData || []);
      }

      // Parts และ stocks ไม่ต้อง filter (เป็นข้อมูลทั่วไป)
      setParts(partsData || []);
      setStocks(stocksData || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load technician portal");
    } finally {
      setLoading(false);
    }
  }

  function handleTechnicianChange(e) {
    const techId = e.target.value ? Number(e.target.value) : null;
    setSelectedTechnicianId(techId);
    loadTechnicianPortal(techId);
  }

  useEffect(() => {
    loadTechnicianPortal();
  }, []);

  // ---- Stats ----
  const pendingJobs = jobs.filter((j) => !j.started_at);
  const inProgressJobs = jobs.filter((j) => j.started_at && !j.finished_at);
  const completedJobs = jobs.filter((j) => j.finished_at);

  const upcomingMaintenance = maintenancePlans.filter((p) => {
    if (!p.next_run_at) return false;
    const today = new Date();
    const nextRun = new Date(p.next_run_at);
    const days = (nextRun - today) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  });

  const lowStockParts = parts.filter((p) => {
    const stock = stocks.find((s) => s.part_id === p.id);
    const qty = stock ? stock.quantity : 0;
    const min = p.min_stock || 5;
    return qty <= min;
  });

  // ---- Recent Jobs ----
  const recentJobs = jobs
    .slice()
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 5);

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* Header */}
        <div className="app-page-header">
          <h2 className="app-page-title">Technician Portal</h2>
          <p className="app-page-subtitle">
            จัดการงานบำรุง ติดตามลิฟต์ และตรวจสอบสต๊อกอะไหล่
          </p>
        </div>

        {/* Selector สำหรับ admin เลือกช่าง */}
        {userRole === "admin" && allTechnicians.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              เลือกช่างที่ต้องการดูข้อมูล:
            </label>
            <select
              value={selectedTechnicianId || ""}
              onChange={handleTechnicianChange}
              className="input"
              style={{ width: "100%", maxWidth: 400 }}
            >
              <option value="">-- เลือกช่าง --</option>
              {allTechnicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} ({tech.email})
                  {tech.specialty ? ` - ${tech.specialty}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && <div className="card">Loading portal...</div>}
        {error && <div className="card error">{error}</div>}

        {!loading && !error && userRole === "admin" && allTechnicians.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 24 }}>
            <p>ยังไม่มีช่างในระบบ กรุณาเพิ่มช่างก่อน</p>
          </div>
        )}

        {!loading && !error && technicianData && (
          <>
            {/* Section 1: Technician Info */}
            {technicianData && (
              <div className="card">
                <div className="card-title">
                  {userRole === "admin" ? "Technician Information" : "Your Information"}
                </div>
                <div>
                  <p>
                    <strong>Name:</strong> {technicianData.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {technicianData.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {technicianData.phone || "-"}
                  </p>
                  <p>
                    <strong>Specialty:</strong> {technicianData.specialty || "-"}
                  </p>
                  <p>
                    <strong>Notes:</strong> {technicianData.notes || "-"}
                  </p>
                </div>
              </div>
            )}

            {/* Section 2: Job Statistics */}
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-title">Pending Jobs</div>
                <div className="stat-number">{pendingJobs.length}</div>
                <div className="stat-hint">Waiting to start</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">In Progress</div>
                <div className="stat-number">{inProgressJobs.length}</div>
                <div className="stat-hint">Currently working</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Completed</div>
                <div className="stat-number">{completedJobs.length}</div>
                <div className="stat-hint">Finished jobs</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Upcoming PM</div>
                <div className="stat-number">{upcomingMaintenance.length}</div>
                <div className="stat-hint">Next 7 days</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Low Stock Parts</div>
                <div className="stat-number">{lowStockParts.length}</div>
                <div className="stat-hint">Need to order</div>
              </div>
            </div>

            {/* Section 3: Pending & In-Progress Jobs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Pending Jobs */}
              <div className="card">
                <div className="card-title">Pending Jobs (Start Soon)</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Elevator</th>
                      <th>Type</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingJobs.slice(0, 5).map((j) => (
                      <tr key={j.id}>
                        <td>{j.id}</td>
                        <td>{j.elevator_name || j.elevator_id}</td>
                        <td>{j.job_type}</td>
                        <td>
                          {j.created_at
                            ? new Date(j.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    {pendingJobs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center">
                          No pending jobs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* In-Progress Jobs */}
              <div className="card">
                <div className="card-title">In-Progress Jobs</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Elevator</th>
                      <th>Started</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inProgressJobs.slice(0, 5).map((j) => (
                      <tr key={j.id}>
                        <td>{j.id}</td>
                        <td>{j.elevator_name || j.elevator_id}</td>
                        <td>
                          {j.started_at
                            ? new Date(j.started_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{j.total_labor_hours || "-"}</td>
                      </tr>
                    ))}
                    {inProgressJobs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center">
                          No jobs in progress.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Upcoming Maintenance */}
            {upcomingMaintenance.length > 0 && (
              <div className="card" style={{ borderLeft: "4px solid #4caf50" }}>
                <div className="card-title">
                  📅 Upcoming Maintenance (Next 7 Days)
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Elevator</th>
                      <th>Template</th>
                      <th>Next Run</th>
                      <th>Days Until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingMaintenance.map((p) => {
                      const daysUntil = Math.ceil(
                        (new Date(p.next_run_at) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr key={p.id}>
                          <td>
                            {p.elevator_name || p.elevator_id}
                          </td>
                          <td>{p.template_name}</td>
                          <td>
                            {new Date(p.next_run_at).toLocaleDateString()}
                          </td>
                          <td>
                            <strong>{daysUntil}</strong> days
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section 5: Low Stock Parts */}
            {lowStockParts.length > 0 && (
              <div className="card" style={{ borderLeft: "4px solid #ff5722" }}>
                <div className="card-title">⚠️ Low Stock Parts</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Part Code</th>
                      <th>Name</th>
                      <th>Current Stock</th>
                      <th>Min Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockParts.map((p) => {
                      const stock = stocks.find((s) => s.part_id === p.id);
                      const qty = stock ? stock.quantity : 0;
                      return (
                        <tr key={p.id}>
                          <td>{p.part_code}</td>
                          <td>{p.name}</td>
                          <td>
                            <span style={{ color: qty <= 0 ? "red" : "orange" }}>
                              {qty}
                            </span>
                          </td>
                          <td>{p.min_stock || 5}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section 6: Elevators Overview */}
            <div className="card">
              <div className="card-title">Elevators You Service</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Building</th>
                    <th>Brand/Model</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {elevators.slice(0, 10).map((e) => (
                    <tr key={e.id}>
                      <td>{e.id}</td>
                      <td>{e.name}</td>
                      <td>{e.building_name || "-"}</td>
                      <td>
                        {e.brand} {e.model}
                      </td>
                      <td>{e.state}</td>
                    </tr>
                  ))}
                  {elevators.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No elevators.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 7: All Parts Inventory */}
            <div className="card">
              <div className="card-title">Parts Inventory</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Part Code</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Stock</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.slice(0, 10).map((p) => {
                    const stock = stocks.find((s) => s.part_id === p.id);
                    const qty = stock ? stock.quantity : 0;
                    return (
                      <tr key={p.id}>
                        <td>{p.part_code}</td>
                        <td>{p.name}</td>
                        <td>{p.brand || "-"}</td>
                        <td>
                          <span
                            style={{
                              color:
                                qty <= (p.min_stock || 5) ? "red" : "green",
                            }}
                          >
                            {qty}
                          </span>
                        </td>
                        <td>{p.unit}</td>
                      </tr>
                    );
                  })}
                  {parts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No parts available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
