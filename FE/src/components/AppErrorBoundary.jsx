import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep a console trace for debugging in development.
    // eslint-disable-next-line no-console
    console.error("App runtime error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const message = this.state.error?.message || "Unknown runtime error";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 760,
            width: "100%",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>Trang gặp lỗi runtime</h2>
          <p style={{ marginTop: 10, color: "#334155", fontWeight: 600 }}>
            {message}
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              marginTop: 12,
              border: "1px solid #bbf7d0",
              background: "#dcfce7",
              color: "#14532d",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              padding: "8px 12px",
            }}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
