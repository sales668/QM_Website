import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Plus, PencilSimple, Trash, SignOut, ChartBar, Package, EnvelopeSimple, House, UploadSimple, X } from "@phosphor-icons/react";
import { useAuth } from "../lib/AuthContext";
import { api, formatApiErrorDetail, API_BASE } from "../lib/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  if (user === null) return <div className="p-10 font-mono-spec">Checking session…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  async function handleLogout() {
    await logout();
    toast.success("Signed out.");
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="admin-dashboard">
      <header className="bg-[#0B1120] text-white border-b border-white/10">
        <div className="mx-auto max-w-[1500px] px-6 lg:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center bg-[#FF3B30] text-white font-mono-spec text-[11px]">QM</div>
            <div>
              <div className="qm-tick text-gray-400">// CONTROL ROOM</div>
              <div className="font-display text-base font-black uppercase tracking-tight">Admin Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-300 hover:text-white" data-testid="admin-home-link">
              <House size={14} weight="bold" /> Public site
            </Link>
            <span className="hidden md:block font-mono-spec text-xs text-gray-400">{user.email}</span>
            <button
              onClick={handleLogout}
              data-testid="admin-logout-btn"
              className="inline-flex items-center gap-2 bg-white text-[#0B1120] hover:bg-[#FF3B30] hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest"
            >
              <SignOut size={14} weight="bold" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 lg:px-12 py-8 grid lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-2">
          <nav className="space-y-1" data-testid="admin-sidebar">
            <NavBtn id="overview" tab={tab} setTab={setTab} icon={ChartBar} label="Overview" />
            <NavBtn id="products" tab={tab} setTab={setTab} icon={Package} label="Products" />
            <NavBtn id="inquiries" tab={tab} setTab={setTab} icon={EnvelopeSimple} label="Inquiries" />
          </nav>
        </aside>
        <section className="lg:col-span-10">
          {tab === "overview" && <Overview />}
          {tab === "products" && <ProductsAdmin />}
          {tab === "inquiries" && <InquiriesAdmin />}
        </section>
      </div>
    </div>
  );
}

function NavBtn({ id, tab, setTab, icon: Icon, label }) {
  const active = tab === id;
  return (
    <button
      onClick={() => setTab(id)}
      data-testid={`admin-tab-${id}`}
      className={`w-full flex items-center gap-3 px-3 py-3 text-sm uppercase tracking-wider font-medium ${
        active ? "bg-[#002FA7] text-white" : "text-[#0B1120] hover:bg-white border border-transparent"
      }`}
    >
      <Icon size={16} weight="bold" /> {label}
    </button>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => setStats(null));
  }, []);
  if (!stats) return <div className="font-mono-spec text-sm text-gray-500">Loading…</div>;

  return (
    <div data-testid="admin-overview">
      <div className="qm-tick mb-3">// STATUS / KPI</div>
      <h2 className="font-display text-3xl font-black uppercase tracking-tight mb-8">Operations at a glance</h2>
      <div className="grid sm:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
        {[
          { k: "Products", v: stats.total_products, code: "K-01" },
          { k: "Inquiries (total)", v: stats.total_inquiries, code: "K-02" },
          { k: "New Inquiries", v: stats.new_inquiries, code: "K-03", accent: true },
        ].map((x) => (
          <div key={x.code} className="bg-white p-8">
            <div className="qm-tick text-gray-400">{x.code} / {x.k}</div>
            <div className={`font-display text-5xl font-black mt-3 ${x.accent ? "text-[#FF3B30]" : "text-[#0B1120]"}`}>{x.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-200 qm-tick">By Category</div>
        <table className="w-full text-sm">
          <tbody>
            {stats.products_by_category.map((c) => (
              <tr key={c.category} className="qm-spec-row">
                <td className="px-6 py-4 font-display font-bold uppercase tracking-tight">{c.category}</td>
                <td className="px-6 py-4 text-right font-mono-spec text-[#002FA7]">{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const blank = {
  category: "Pipes",
  category_slug: "pipes",
  name: "",
  subtype: "",
  grade: "",
  grades: "",
  standards: "",
  sizes: "",
  forms: "",
  applications: "",
  description: "",
  image_url: "",
  featured: false,
  sort_order: 100,
};

function ProductsAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null | {id?, ...form}
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const r = await api.get("/products");
      setItems(r.data);
    } catch { setItems([]); }
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditing({ ...blank }); setShowForm(true); }
  function startEdit(p) {
    setEditing({
      ...p,
      grades: (p.grades || []).join(", "),
      standards: (p.standards || []).join(", "),
      forms: (p.forms || []).join(", "),
      applications: (p.applications || []).join(", "),
    });
    setShowForm(true);
  }
  async function remove(id) {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  }

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...editing,
      grades: editing.grades.split(",").map((s) => s.trim()).filter(Boolean),
      standards: editing.standards.split(",").map((s) => s.trim()).filter(Boolean),
      forms: editing.forms.split(",").map((s) => s.trim()).filter(Boolean),
      applications: editing.applications.split(",").map((s) => s.trim()).filter(Boolean),
      sort_order: Number(editing.sort_order) || 100,
    };
    try {
      if (editing.id) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success("Product updated.");
      } else {
        await api.post("/products", payload);
        toast.success("Product created.");
      }
      setShowForm(false); setEditing(null); load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  }

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="qm-tick mb-2">// PRODUCTS / MANAGE</div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">Catalog</h2>
        </div>
        <button onClick={startNew} data-testid="admin-product-new-btn" className="inline-flex items-center gap-2 bg-[#002FA7] hover:bg-[#00247D] text-white px-5 py-3 text-xs font-bold uppercase tracking-widest">
          <Plus size={14} weight="bold" /> Add Product
        </button>
      </div>

      {showForm && editing && (
        <form onSubmit={save} className="border border-gray-200 bg-white p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="admin-product-form">
          <Inp label="Name" v={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} required />
          <Inp label="Subtype (e.g. 90° LR Elbow)" v={editing.subtype} onChange={(v) => setEditing({ ...editing, subtype: v })} />
          <Inp label="Category (e.g. Pipes)" v={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} required />
          <Inp label="Category Slug (e.g. pipes)" v={editing.category_slug} onChange={(v) => setEditing({ ...editing, category_slug: v })} required />
          <Inp label="Headline Grade Label" v={editing.grade} onChange={(v) => setEditing({ ...editing, grade: v })} />
          <Inp label="Sizes (e.g. 1/2&quot; – 24&quot; NPS)" v={editing.sizes} onChange={(v) => setEditing({ ...editing, sizes: v })} />
          <Inp label="Available Grades (comma-sep)" v={editing.grades} onChange={(v) => setEditing({ ...editing, grades: v })} full />
          <Inp label="Standards (comma-sep)" v={editing.standards} onChange={(v) => setEditing({ ...editing, standards: v })} />
          <Inp label="Forms (comma-sep)" v={editing.forms} onChange={(v) => setEditing({ ...editing, forms: v })} />
          <Inp label="Applications (comma-sep)" v={editing.applications} onChange={(v) => setEditing({ ...editing, applications: v })} full />
          <Inp label="Description" v={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} full textarea />
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block font-mono-spec">Product Image</label>
            <ImageUploader
              value={editing.image_url}
              onChange={(v) => setEditing({ ...editing, image_url: v })}
            />
          </div>
          <Inp label="Sort Order" type="number" v={editing.sort_order} onChange={(v) => setEditing({ ...editing, sort_order: v })} />
          <label className="flex items-center gap-3 mt-7 text-sm">
            <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} data-testid="admin-product-featured" />
            <span className="font-mono-spec text-xs uppercase tracking-widest">Featured on home</span>
          </label>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="border border-gray-300 px-5 py-3 text-xs font-bold uppercase tracking-widest">Cancel</button>
            <button type="submit" className="bg-[#002FA7] hover:bg-[#00247D] text-white px-5 py-3 text-xs font-bold uppercase tracking-widest" data-testid="admin-product-save-btn">Save</button>
          </div>
        </form>
      )}

      <div className="border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm" data-testid="admin-products-table">
          <thead className="bg-[#0B1120] text-white font-mono-spec text-[11px] uppercase tracking-widest">
            <tr>
              <th className="px-5 py-3 text-left">Name / Grade</th>
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Forms</th>
              <th className="px-5 py-3 text-left">Featured</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="qm-spec-row" data-testid={`admin-product-row-${p.id}`}>
                <td className="px-5 py-4">
                  <div className="font-display font-bold">{p.name}</div>
                  <div className="font-mono-spec text-[11px] text-[#002FA7]">{p.grade}</div>
                </td>
                <td className="px-5 py-4 text-gray-700">{p.category}</td>
                <td className="px-5 py-4 hidden md:table-cell text-gray-500 text-xs">{(p.forms || []).slice(0, 3).join(", ")}</td>
                <td className="px-5 py-4">
                  {p.featured ? <span className="text-[10px] font-mono-spec uppercase tracking-widest bg-[#002FA7] text-white px-2 py-1">Yes</span> : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1 text-[#002FA7] text-[11px] font-bold uppercase tracking-widest mr-4" data-testid={`admin-edit-${p.id}`}>
                    <PencilSimple size={14} weight="bold" /> Edit
                  </button>
                  <button onClick={() => remove(p.id)} className="inline-flex items-center gap-1 text-[#FF3B30] text-[11px] font-bold uppercase tracking-widest" data-testid={`admin-delete-${p.id}`}>
                    <Trash size={14} weight="bold" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Inp({ label, v, onChange, type = "text", full, textarea, required }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block font-mono-spec">{label}</label>
      {textarea ? (
        <textarea value={v} onChange={(e) => onChange(e.target.value)} required={required} rows={3}
          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002FA7] rounded-none" />
      ) : (
        <input type={type} value={v} onChange={(e) => onChange(e.target.value)} required={required}
          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002FA7] rounded-none" />
      )}
    </div>
  );
}

function ImageUploader({ value, onChange }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function resolveSrc(v) {
    if (!v) return "";
    if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")) return v;
    if (v.startsWith("/api/")) return `${process.env.REACT_APP_BACKEND_URL}${v}`;
    return v;
  }

  async function uploadFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large. Max 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
      toast.success("Image uploaded.");
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div data-testid="image-uploader">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        className={`relative border-2 border-dashed cursor-pointer transition-colors ${dragging ? "border-[#002FA7] bg-blue-50" : "border-gray-300 bg-[#FAFAFA] hover:bg-gray-50"}`}
        style={{ minHeight: 160 }}
      >
        {value ? (
          <div className="flex items-center gap-4 p-4">
            <img
              src={resolveSrc(value)}
              alt="Preview"
              className="w-32 h-24 object-cover border border-gray-200 bg-white"
              onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
            />
            <div className="flex-1 min-w-0">
              <div className="qm-tick text-gray-500 mb-1">Image attached</div>
              <div className="font-mono-spec text-xs text-gray-700 truncate">{value}</div>
              <div className="mt-2 flex gap-3">
                <button type="button" onClick={(e) => { e.stopPropagation(); fileInput.current?.click(); }}
                  className="text-[11px] font-bold uppercase tracking-widest text-[#002FA7] hover:underline inline-flex items-center gap-1">
                  <UploadSimple size={12} weight="bold" /> Replace
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
                  className="text-[11px] font-bold uppercase tracking-widest text-[#FF3B30] hover:underline inline-flex items-center gap-1">
                  <X size={12} weight="bold" /> Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 h-full" style={{ minHeight: 160 }}>
            <UploadSimple size={28} weight="duotone" className="text-[#002FA7]" />
            <div className="font-display font-bold uppercase tracking-tight mt-2 text-[#0B1120]">
              {uploading ? "Uploading…" : "Drop image here or click to upload"}
            </div>
            <div className="qm-tick text-gray-500 mt-1">JPG · PNG · WEBP · max 8 MB</div>
          </div>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadFile(e.target.files?.[0])}
        data-testid="image-file-input"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste any public image URL here"
        className="w-full mt-3 border border-gray-300 bg-white px-3 py-2 text-sm font-mono-spec focus:outline-none focus:ring-2 focus:ring-[#002FA7] rounded-none"
        data-testid="image-url-input"
      />
    </div>
  );
}

function InquiriesAdmin() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");

  async function load() {
    try {
      const r = await api.get("/inquiries", { params: filter ? { status: filter } : {} });
      setItems(r.data);
    } catch { setItems([]); }
  }
  useEffect(() => { load(); }, [filter]);

  async function setStatus(id, status) {
    try { await api.patch(`/inquiries/${id}`, { status }); toast.success("Updated"); load(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  }
  async function remove(id) {
    if (!window.confirm("Delete inquiry?")) return;
    try { await api.delete(`/inquiries/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  }

  return (
    <div data-testid="admin-inquiries">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="qm-tick mb-2">// INQUIRIES / RFQ INBOX</div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">Quote Requests</h2>
        </div>
        <div className="flex gap-2">
          {[
            { id: "", label: "All" },
            { id: "new", label: "New" },
            { id: "in_review", label: "In Review" },
            { id: "quoted", label: "Quoted" },
            { id: "closed", label: "Closed" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-widest border ${filter === f.id ? "bg-[#002FA7] text-white border-[#002FA7]" : "border-gray-300 bg-white"}`}
              data-testid={`admin-inquiry-filter-${f.id || "all"}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="border border-gray-200 bg-white p-10 text-center font-mono-spec text-sm text-gray-500" data-testid="admin-no-inquiries">No inquiries.</div>
        ) : items.map((q) => (
          <div key={q.id} className="border border-gray-200 bg-white p-6" data-testid={`admin-inquiry-${q.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="qm-tick text-gray-400">{new Date(q.created_at).toLocaleString()}</div>
                <div className="font-display text-lg font-black uppercase tracking-tight mt-1">{q.name} {q.company && <span className="text-gray-400 font-normal text-base">· {q.company}</span>}</div>
                <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-4">
                  <a href={`mailto:${q.email}`} className="text-[#002FA7] font-mono-spec">{q.email}</a>
                  {q.phone && <span>{q.phone}</span>}
                  {q.country && <span className="text-gray-500">· {q.country}</span>}
                </div>
              </div>
              <StatusBadge status={q.status} />
            </div>

            {q.materials && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="qm-tick text-gray-500 mb-1">Materials</div>
                <pre className="font-mono-spec text-[12px] whitespace-pre-wrap text-[#0B1120]">{q.materials}</pre>
              </div>
            )}
            {q.quantity && <div className="mt-2 text-sm"><span className="qm-tick text-gray-500">Qty:</span> <span className="font-mono-spec text-[13px]">{q.quantity}</span></div>}
            {q.message && (
              <div className="mt-4 text-sm text-gray-700 leading-relaxed">{q.message}</div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              {["new", "in_review", "quoted", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(q.id, s)}
                  disabled={q.status === s}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 border ${q.status === s ? "bg-[#002FA7] text-white border-[#002FA7]" : "border-gray-300 bg-white hover:bg-gray-50"}`}
                  data-testid={`set-status-${q.id}-${s}`}
                >
                  Mark {s.replace("_", " ")}
                </button>
              ))}
              <button onClick={() => remove(q.id)} className="ml-auto text-[10px] font-bold uppercase tracking-widest px-3 py-2 text-[#FF3B30] hover:bg-red-50" data-testid={`delete-inquiry-${q.id}`}>
                <Trash size={12} weight="bold" className="inline mr-1" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    new: "bg-[#FF3B30] text-white",
    in_review: "bg-[#002FA7] text-white",
    quoted: "bg-[#0B1120] text-white",
    closed: "bg-gray-200 text-gray-700",
  };
  return (
    <span className={`text-[10px] font-mono-spec uppercase tracking-widest px-3 py-1.5 ${map[status] || "bg-gray-100 text-gray-700"}`}>
      {status?.replace("_", " ")}
    </span>
  );
}
