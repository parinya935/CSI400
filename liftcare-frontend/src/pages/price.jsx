// src/pages/pricing.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptySettings = {
  id: null,
  call_fee: 0,
  labor_rate_per_hour: 0,
  parts_markup_percent: 0,
  currency: "THB",
};

export default function PricingSettings() {
  const api = useApi();
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/pricing-settings");
      setSettings({
        id: data.id ?? null,
        call_fee: data.call_fee ?? 0,
        labor_rate_per_hour: data.labor_rate_per_hour ?? 0,
        parts_markup_percent: data.parts_markup_percent ?? 0,
        currency: data.currency || "THB",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load pricing settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setSettings((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: settings.id,
        call_fee: Number(settings.call_fee || 0),
        labor_rate_per_hour: Number(settings.labor_rate_per_hour || 0),
        parts_markup_percent: Number(settings.parts_markup_percent || 0),
        currency: settings.currency || "THB",
      };
      const updated = await api.put("/api/pricing-settings", payload);
      setSettings({
        id: updated.id,
        call_fee: updated.call_fee ?? 0,
        labor_rate_per_hour: updated.labor_rate_per_hour ?? 0,
        parts_markup_percent: updated.parts_markup_percent ?? 0,
        currency: updated.currency || "THB",
      });
      alert("บันทึกค่าตั้งราคาสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving pricing settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Pricing Settings</h2>

      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <div className="card">
          <div className="card-title">Global Pricing Configuration</div>
          {error && <div className="card error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
            <label>
              Call Fee (ค่าเรียกช่าง)
              <input
                type="number"
                name="call_fee"
                value={settings.call_fee}
                onChange={handleChange}
                className="input"
              />
            </label>

            <label>
              Labor Rate per Hour (ค่าแรง/ชั่วโมง)
              <input
                type="number"
                name="labor_rate_per_hour"
                value={settings.labor_rate_per_hour}
                onChange={handleChange}
                className="input"
              />
            </label>

            <label>
              Parts Markup (%) (กำไรอะไหล่ %)
              <input
                type="number"
                name="parts_markup_percent"
                value={settings.parts_markup_percent}
                onChange={handleChange}
                className="input"
              />
            </label>

            <label>
              Currency
              <input
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="input"
              />
            </label>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}