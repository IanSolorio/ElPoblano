import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ eyebrow, title, description, actions, children }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-page-header">
          <div>
            <span className="admin-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="admin-page-header__actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}
