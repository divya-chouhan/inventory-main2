import { Component } from "react";

/**
 * Catches render-time errors in the page tree so a single failing page
 * shows a readable message instead of unmounting the entire app (blank screen).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface in the console for debugging.
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="empty" style={{ marginTop: 40 }}>
          <h4>Something went wrong</h4>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 14 }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
