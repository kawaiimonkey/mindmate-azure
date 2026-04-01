"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ensureUserId, getApiBaseUrl } from "@/lib/mindmate";

const moodBars = [
  { day: "Mon", height: "60%", color: "#8BAF93" },
  { day: "Tue", height: "40%", color: "#B8A9CC" },
  { day: "Wed", height: "80%", color: "#8BAF93" },
  { day: "Thu", height: "30%", color: "#D9534F" },
  { day: "Fri", height: "50%", color: "#B8A9CC" }
];

function formatTaskSubtitle(task) {
  const subtitle = task.subtitle || "Added from your AI check-in.";
  if (!task.dueDate) return subtitle;

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return subtitle;
  return `${subtitle} | Due ${due.toLocaleString()}`;
}

export default function DashboardPage() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const nextUserId = ensureUserId();
    setUserId(nextUserId);

    async function loadTasks() {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        setStatus(`Connected user: ${nextUserId} | API: not configured`);
        setTasks([]);
        return;
      }

      setStatus(`Connected user: ${nextUserId} | API: ${apiBaseUrl}`);

      try {
        const response = await fetch(
          `${apiBaseUrl}/tasks?userId=${encodeURIComponent(nextUserId)}`
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.details || payload.error || "Unable to load tasks.");
        }

        setTasks(payload?.data || []);
        setLoadError("");
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Unknown error");
        setTasks([]);
      }
    }

    void loadTasks();
  }, []);

  return (
    <main className="dashboard-shell app-shell">
      <Sidebar />

      <section className="dashboard-main">
        <header className="page-header">
          <h1 className="page-title">Welcome back, Student</h1>
          <p className="page-subtitle">Here is your wellness overview and schedule.</p>
          <p className="status-note">{status || `Connected user: ${userId}`}</p>
        </header>

        <div className="dashboard-grid">
          <div>
            <section className="card" style={{ minHeight: "400px" }}>
              <h2 className="card-title">AI Extracted Schedule</h2>

              {loadError ? (
                <div className="empty-state">Task loading failed: {loadError}</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  No AI-extracted tasks yet. Start a chat check-in and MindMate will populate
                  your schedule here.
                </div>
              ) : (
                <ul className="task-list">
                  {tasks.map((task) => {
                    const isDone = task.status === "done";
                    return (
                      <li
                        key={task._id || `${task.title}-${task.dueDate || "task"}`}
                        className="task-item"
                        style={isDone ? { opacity: 0.6 } : undefined}
                      >
                        <div>
                          <strong
                            className="task-title"
                            style={isDone ? { textDecoration: "line-through" } : undefined}
                          >
                            {task.title}
                          </strong>
                          <span className="task-meta">{formatTaskSubtitle(task)}</span>
                        </div>
                        <span className={`tag${isDone ? " done" : ""}`}>
                          {isDone ? "Done" : "Pending"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <div>
            <section className="card">
              <h2 className="card-title">Weekly Mood Check-in</h2>
              <div className="mood-row">
                {moodBars.map((bar) => (
                  <div className="mood-bar-container" key={bar.day}>
                    <div
                      className="mood-bar"
                      style={{ height: bar.height, background: bar.color }}
                    />
                    <span className="mood-label">{bar.day}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card alert-card">
              <h2 className="card-title">Emergency Alert Contact</h2>
              <p className="alert-desc">
                This panel is still using placeholder UI. It can be connected once the
                settings Function is added.
              </p>
              <div className="input-group">
                <input className="text-input" type="email" placeholder="e.g., counselor@sait.ca" />
                <button type="button" className="btn-base">
                  Save Contact
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
