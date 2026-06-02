import { Component } from "react";

/**
 * Catches render-time errors in any dashboard tab so a single broken
 * component shows a graceful message instead of blanking the whole app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Dashboard tab crashed:", error, info);
  }

  componentDidUpdate(prevProps) {
    // Reset the boundary when the active tab changes
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "3rem 2rem", textAlign: "center", fontFamily: "'Jost', sans-serif" }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.8rem", letterSpacing: "0.12em", color: "#C8852A", marginBottom: "0.75rem" }}>
            SOMETHING WENT WRONG
          </p>
          <p style={{ fontSize: "0.95rem", color: "#1A1008", marginBottom: "0.5rem" }}>
            This panel hit an error and couldn&apos;t render.
          </p>
          <p style={{ fontSize: "0.8rem", color: "#8C7B6A", marginBottom: "1.5rem", maxWidth: 420, marginInline: "auto" }}>
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: "#C8852A", color: "#FDFAF5", border: "none", padding: "0.6rem 1.4rem", borderRadius: 4, fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.1em", cursor: "pointer" }}
          >
            TRY AGAIN
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
