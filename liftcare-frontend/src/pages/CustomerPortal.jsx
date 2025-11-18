import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

export default function CustomerPortal() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [customerData, setCustomerData] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCustomerPortal() {
    try {
      setLoading(true);
      setError("");

      const [cust, bld, elv, con, quo, inv] = await Promise.all([
        api.get("/api/customers/me"),
        api.get("/api/buildings"),
        api.get("/api/elevators"),
        api.get("/api/contracts"),
        api.get("/api/quotations"),
        api.get("/api/invoices"),
      ]);

      setCustomerData(cust);
      setBuildings(bld || []);
      setElevators(elv || []);
      setContracts(con || []);
      setQuotations(quo || []);
      setInvoices(inv || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load customer portal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomerPortal();
  }, []);

  // ---- Stats ----
  const stats = {
    buildings: buildings.length,
    elevators: elevators.length,
    activeContracts: contracts.filter((c) => {
      const today = new Date();
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return start <= today && today <= end;
    }).length,
    pendingQuotations: quotations.filter((q) => q.status === "draft").length,
    unpaidInvoices: invoices.filter((i) => i.status === "unpaid" || i.status === "partial").length,
  };

  // ---- Recent invoices ----
  const recentInvoices = invoices
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  // ---- Upcoming contracts expiry ----
  const upcomingExpiry = contracts
    .filter((c) => {
      const end = new Date(c.end_date);
      const today = new Date();
      const days = (end - today) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 90;
    })
    .slice(0, 3);

  return (
    <ProtectedPage userRole={userRole} allowedRoles="customer">
      <div>
        {/* Header */}
        <div className="app-page-header">
          <h2 className="app-page-title">Customer Portal</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลอาคาร ลิฟต์ และติดตามสัญญา ใบเสนอราคา ใบแจ้งหนี้
          </p>
        </div>

        {loading && <div className="card">Loading portal...</div>}
        {error && <div className="card error">{error}</div>}

        {!loading && !error && (
          <>
            {/* Section 1: Company Info */}
            <div className="card">
              <div className="card-title">Your Company Information</div>
              {customerData && (
                <div>
                  <p>
                    <strong>Name:</strong> {customerData.name}
                  </p>
                  <p>
                    <strong>Business Type:</strong> {customerData.business_type}
                  </p>
                  <p>
                    <strong>Address:</strong> {customerData.address || "-"}
                  </p>
                  <p>
                    <strong>Contact:</strong> {customerData.contact_name || "-"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {customerData.contact_phone || "-"}
                  </p>
                  <p>
                    <strong>Email:</strong> {customerData.contact_email || "-"}
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Statistics */}
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-title">Buildings</div>
                <div className="stat-number">{stats.buildings}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Elevators</div>
                <div className="stat-number">{stats.elevators}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Active Contracts</div>
                <div className="stat-number">{stats.activeContracts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Pending Quotations</div>
                <div className="stat-number">{stats.pendingQuotations}</div>
              </div>
              <div className="stat-card">
                <div className="stat-title">Unpaid Invoices</div>
                <div className="stat-number">{stats.unpaidInvoices}</div>
              </div>
            </div>

            {/* Section 3: Buildings & Elevators */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Buildings */}
              <div className="card">
                <div className="card-title">Buildings</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.name}</td>
                        <td>{b.building_type || "-"}</td>
                      </tr>
                    ))}
                    {buildings.length === 0 && (
                      <tr>
                        <td colSpan={2} className="text-center">
                          No buildings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Elevators */}
              <div className="card">
                <div className="card-title">Your Elevators</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Building</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elevators.map((e) => (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td>{e.building_name || "-"}</td>
                        <td>{e.state}</td>
                      </tr>
                    ))}
                    {elevators.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No elevators.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Contracts */}
            <div className="card">
              <div className="card-title">Active Contracts</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts
                    .filter((c) => {
                      const today = new Date();
                      const start = new Date(c.start_date);
                      const end = new Date(c.end_date);
                      return start <= today && today <= end;
                    })
                    .map((c) => (
                      <tr key={c.id}>
                        <td>{c.contract_code}</td>
                        <td>
                          {c.contract_type === "annual"
                            ? "Annual"
                            : "Per Call"}
                        </td>
                        <td>
                          {new Date(c.start_date).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(c.end_date).toLocaleDateString()}
                        </td>
                        <td>Active</td>
                      </tr>
                    ))}
                  {contracts.filter((c) => {
                    const today = new Date();
                    const start = new Date(c.start_date);
                    const end = new Date(c.end_date);
                    return start <= today && today <= end;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No active contracts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 5: Upcoming Contract Expiry */}
            {upcomingExpiry.length > 0 && (
              <div className="card" style={{ borderLeft: "4px solid #ff9800" }}>
                <div className="card-title">⚠️ Contracts Expiring Soon</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>End Date</th>
                      <th>Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingExpiry.map((c) => {
                      const daysLeft = Math.ceil(
                        (new Date(c.end_date) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr key={c.id}>
                          <td>{c.contract_code}</td>
                          <td>
                            {new Date(c.end_date).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              style={{
                                color: daysLeft <= 30 ? "red" : "orange",
                              }}
                            >
                              {daysLeft} days
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section 6: Quotations & Invoices */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Quotations */}
              <div className="card">
                <div className="card-title">Quotations</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.slice(0, 5).map((q) => (
                      <tr key={q.id}>
                        <td>{q.quotation_code}</td>
                        <td>{q.status}</td>
                        <td>{q.total_amount}</td>
                      </tr>
                    ))}
                    {quotations.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No quotations.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recent Invoices */}
              <div className="card">
                <div className="card-title">Recent Invoices</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((i) => (
                      <tr key={i.id}>
                        <td>{i.invoice_code}</td>
                        <td>{i.status}</td>
                        <td>{i.total_amount}</td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center">
                          No invoices.
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
    </ProtectedPage>
  );
}
