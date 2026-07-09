import { Link } from 'react-router-dom';
import { FiArrowRight, FiShield, FiTruck, FiMessageCircle, FiStar } from 'react-icons/fi';
import { MdFastfood, MdLocalGroceryStore, MdDeliveryDining, MdStorefront } from 'react-icons/md';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing" id="landing-page">
      {/* ── Navbar ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <img src="/logo.png" alt="FreshKart Logo" className="landing-logo-img" />
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn-ghost" id="landing-login-btn">Log In</Link>
            <Link to="/signup" className="btn-primary-landing" id="landing-signup-btn">
              Sign Up <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
        <div className="hero-content animate-fadeInUp">
          <div className="hero-badge"> Fast Delivery in 30 Minutes</div>
          <h1 className="hero-title">
            Fresh Food &<br />
            Groceries at Your<br />
            <span className="text-gradient">Doorstep</span>
          </h1>
          <p className="hero-subtitle">
            Order from local restaurants and grocery stores. Fresh, fast, and reliable delivery — every single time.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn-hero-primary" id="hero-signup-btn">
              Get Started Free <FiArrowRight />
            </Link>
            <Link to="/login" className="btn-hero-secondary" id="hero-login-btn">
              I have an account
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Restaurants</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">99%</span>
              <span className="stat-label">On-Time</span>
            </div>
          </div>
        </div>
        <div className="hero-visual animate-fadeInUp delay-2">
          <div className="hero-card hero-card-1">
            <MdFastfood size={32} />
            <span>Fresh Food</span>
          </div>
          <div className="hero-card hero-card-2">
            <MdLocalGroceryStore size={32} />
            <span>Groceries</span>
          </div>
          <div className="hero-card hero-card-3">
            <MdDeliveryDining size={32} />
            <span>Fast Delivery</span>
          </div>
          <div className="hero-card hero-card-4">
            <MdStorefront size={32} />
            <span>Local Shops</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features" id="features-section">
        <h2 className="section-title">Why Choose <span className="text-gradient">FreshKart</span>?</h2>
        <div className="features-grid">
          <div className="feature-card animate-fadeInUp delay-1">
            <div className="feature-icon"><FiTruck /></div>
            <h3>Lightning Fast Delivery</h3>
            <p>Get your food and groceries delivered within 30 minutes from local shops.</p>
          </div>
          <div className="feature-card animate-fadeInUp delay-2">
            <div className="feature-icon"><FiShield /></div>
            <h3>Secure Payments</h3>
            <p>Multiple payment options with end-to-end encrypted transactions.</p>
          </div>
          <div className="feature-card animate-fadeInUp delay-3">
            <div className="feature-icon"><FiMessageCircle /></div>
            <h3>Live Chat Support</h3>
            <p>Real-time chat with sellers and support for seamless communication.</p>
          </div>
          <div className="feature-card animate-fadeInUp delay-4">
            <div className="feature-icon"><FiStar /></div>
            <h3>Trusted Sellers</h3>
            <p>Verified sellers with ratings and reviews from real customers.</p>
          </div>
        </div>
      </section>

      {/* ── Roles Section ── */}
      <section className="roles-section">
        <h2 className="section-title">Built For <span className="text-gradient">Everyone</span></h2>
        <div className="roles-grid">
          <div className="role-card buyer-card">
            <span className="role-emoji"></span>
            <h3>Buyers</h3>
            <p>Browse, order, and track deliveries from your favorite shops.</p>
          </div>
          <div className="role-card seller-card">
            <span className="role-emoji"></span>
            <h3>Sellers</h3>
            <p>Manage inventory, track sales, and connect with customers.</p>
          </div>
          <div className="role-card admin-card">
            <span className="role-emoji">👨‍💼</span>
            <h3>Admins</h3>
            <p>Monitor the platform, manage sellers, and analyze performance.</p>
          </div>
          <div className="role-card delivery-card">
            <span className="role-emoji">🛵</span>
            <h3>Delivery Partners</h3>
            <p>Accept orders, navigate routes, and earn on your own schedule.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.png" alt="FreshKart Logo" className="landing-logo-img-footer" />
          </div>
          <p>&copy; 2026 FreshKart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
