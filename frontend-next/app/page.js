import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing app-shell">
      <div className="hero-container">
        <section className="hero-content">
          <div className="logo-wrapper">
            <div className="logo-mark">M</div>
            <div className="logo-text">MindMate</div>
          </div>

          <h1 className="hero-title">
            Breathe.
            <br />
            Focus. Thrive.
          </h1>

          <p className="hero-subtitle">
            Your intelligent web companion for academic wellness. Powered by Azure AI
            to help students manage stress, organize schedules, and find balance.
          </p>

          <div className="hero-actions">
            <Link href="/chat" className="btn-base btn-primary">
              Start Chat
            </Link>
            <Link href="/dashboard" className="btn-base btn-secondary">
              Dashboard
            </Link>
          </div>

          <p className="hero-note">Prepared as a safe Next.js refactor track alongside the current frontend.</p>
        </section>

        <section className="hero-visual" aria-hidden="true">
          <div className="blob green" />
          <div className="blob purple" />
          <div className="glass-card">
            <div className="visual-message">
              Clear your mind.
              <br />
              We handle the rest.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
