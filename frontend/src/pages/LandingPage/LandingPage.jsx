import React, { useState, useEffect } from 'react';
import {
  Menu, X, Check, ArrowRight, BarChart3, Users,
  FileText, CreditCard, LayoutDashboard, Globe,
  ShieldCheck, FilePieChart, Facebook, Twitter, Linkedin,
  Building2, Mail, Calendar, Award, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import fullLogo from '../../assets/Images/image.png';
import axiosInstance from '../../api/axiosInstance';
import toast, { Toaster } from 'react-hot-toast';
import planRequestService from '../../services/planRequestService';

const LandingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Plan Request Modal States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPlanForRequest, setSelectedPlanForRequest] = useState(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    companyName: '',
    email: '',
    billingCycle: 'Monthly',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleOpenRequestModal = (plan) => {
    setSelectedPlanForRequest(plan);
    setShowRequestModal(true);
  };

  const handleRequestInputChange = (e) => {
    setRequestFormData({ ...requestFormData, [e.target.name]: e.target.value });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlanForRequest) return;

    try {
      setSubmittingRequest(true);
      const dataToSubmit = {
        ...requestFormData,
        planId: selectedPlanForRequest.id,
        planName: selectedPlanForRequest.name
      };

      await planRequestService.submitPublicPlanRequest(dataToSubmit);
      toast.success('Request submitted successfully! We will contact you soon.');
      setShowRequestModal(false);
      setRequestFormData({
        companyName: '',
        email: '',
        billingCycle: 'Monthly',
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' }
  ];

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get('/plans/public/all');
        if (response.data) {
          // Filter only active plans
          setPlans(response.data.filter(plan => plan.status === 'Active'));
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <div className="landing-page">
      <Toaster position="top-right" />

      {/* --- Navbar --- */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-content">
          <div className="nav-left">
            <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }}>
              <img src={fullLogo} alt="Kiaan Technology" style={{ height: '40px' }} />
            </a>
          </div>

          <div className="nav-right">
            {/* Desktop Nav */}
            <div className="nav-links">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="nav-link">
                  {link.name}
                </a>
              ))}
            </div>

            <div className="nav-actions">
              <button onClick={handleLogin} className="btn btn-primary btn-sm">
                Login
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              className="hamburger"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div style={{ marginTop: 'auto' }}>
              <button onClick={handleLogin} className="btn btn-primary" style={{ width: '100%' }}>
                Login to Account
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-badge">
            <span style={{ fontSize: '1.2em' }}>🚀</span> #1 Invoicing Solution for Southern Africa
          </div>

          <h1 className="hero-title">
            Manage Invoices & Payments <br /> Smarter with <span>Kiaan Technology</span>
          </h1>

          <p className="hero-subtitle">
            The all-in-one financial platform for freelancers and small businesses. <br className="hid-mob" /> Create quotes, track payments, and automate your workflow in seconds.
          </p>

          <div className="hero-ctas">
            <button onClick={handleLogin} className="btn btn-primary">
              Get Started Free <ArrowRight size={20} />
            </button>
            <button onClick={handleLogin} className="btn btn-outline">
              Login
            </button>
          </div>

          <div className="hero-image-container">
            <div className="hero-image-placeholder">
              {/* CSS Dashboard Mockup */}
              <div className="mock-sidebar">
                <div style={{ width: '40%', height: '20px', background: 'var(--primary-dark)', borderRadius: '4px', marginBottom: '20px' }}></div>
                <div className="mock-nav-item active"></div>
                <div className="mock-nav-item"></div>
                <div className="mock-nav-item"></div>
                <div className="mock-nav-item"></div>
              </div>
              <div className="mock-header">
                <div style={{ width: '100px', height: '10px', background: '#f1f5f9', borderRadius: '4px' }}></div>
                <div className="mock-avatar"></div>
              </div>
              <div className="mock-content">
                <div className="mock-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>$12,450</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Revenue</div>
                </div>
                <div className="mock-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>45</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pending Invoices</div>
                </div>
                <div className="mock-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>12</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Overdue</div>
                </div>

                <div className="mock-chart">
                  <div style={{ padding: '15px', fontSize: '0.9rem', color: '#64748b' }}>Revenue Trend</div>
                  <div className="mock-bar" style={{ left: '20px', height: '40%' }}></div>
                  <div className="mock-bar" style={{ left: '60px', height: '60%' }}></div>
                  <div className="mock-bar" style={{ left: '100px', height: '30%' }}></div>
                  <div className="mock-bar" style={{ left: '140px', height: '80%' }}></div>
                  <div className="mock-bar" style={{ left: '180px', height: '50%' }}></div>
                  <div className="mock-bar" style={{ left: '220px', height: '70%' }}></div>
                </div>
                <div className="mock-list">
                  <div style={{ padding: '15px', fontSize: '0.9rem', color: '#64748b' }}>Recent Activity</div>
                  <div style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '8px', width: '80%', background: '#f1f5f9', borderRadius: '4px' }}></div>
                    <div style={{ height: '8px', width: '60%', background: '#f1f5f9', borderRadius: '4px' }}></div>
                    <div style={{ height: '8px', width: '90%', background: '#f1f5f9', borderRadius: '4px' }}></div>
                    <div style={{ height: '8px', width: '70%', background: '#f1f5f9', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative Overlay Elements */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary)', opacity: '0.1', borderRadius: '50%', filter: 'blur(40px)', zIndex: '-1' }}></div>
            <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '150px', height: '150px', background: 'var(--secondary)', opacity: '0.1', borderRadius: '50%', filter: 'blur(50px)', zIndex: '-1' }}></div>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Core Features</span>
            <h2 className="section-title">Everything you need to <br /> run your business</h2>
            <p className="section-desc">From quotes to payments, Kiaan Technology provides a complete suite of professional tools to manage your finances effortlessly.</p>
          </div>

          <div className="features-grid">
            <FeatureCard
              icon={<BarChart3 size={28} />}
              title="Dashboard Analytics"
              description="Get real-time insights into your revenue, expenses, and cash flow with intuitive charts."
            />
            <FeatureCard
              icon={<Users size={28} />}
              title="Client Management"
              description="Organize client details, history, and communications in one centralized secure place."
            />
            <FeatureCard
              icon={<FileText size={28} />}
              title="Quote & Invoice Builder"
              description="Create professional quotes and convert them to invoices with a single click."
            />
            <FeatureCard
              icon={<CreditCard size={28} />}
              title="Payment Tracking"
              description="Track paid, pending, and overdue invoices easily. Never miss a payment again."
            />
            <FeatureCard
              icon={<Globe size={28} />}
              title="Multi-Currency Support"
              description="Support for ZAR, NAD, BWP, USD, and more. Perfect for cross-border business."
            />
            <FeatureCard
              icon={<FilePieChart size={28} />}
              title="Reports & Tax Summary"
              description="Generate detailed financial reports and tax summaries for accounting periods."
            />
            <FeatureCard
              icon={<ShieldCheck size={28} />}
              title="Secure Cloud Access"
              description="Your data is encrypted and backed up in the cloud. Access from anywhere, anytime."
            />
            <FeatureCard
              icon={<LayoutDashboard size={28} />}
              title="Inventory Management"
              description="Keep track of your products and services with simple inventory tools."
            />
          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-desc">Simplify your workflow in 4 easy steps</p>
          </div>

          <div className="steps-container">
            <Step num="1" title="Create Quote" desc="Send a professional estimate to your client for approval." />
            <Step num="2" title="Convert to Invoice" desc="Turn accepted quotes into invoices instantly." />
            <Step num="3" title="Deliver Service" desc="Complete the work or deliver the products to the client." />
            <Step num="4" title="Get Paid" desc="Receive payment and track it automatically in your dashboard." />
          </div>
        </div>
      </section>

      {/* --- Pricing Plans Section --- */}
      <section id="pricing" className="features"> {/* Reusing padding/bg */}
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-desc">Choose the plan that fits your business stage.</p>
          </div>

          <div className="pricing-grid">
            {loading ? (
              <p>Loading plans...</p>
            ) : plans.length > 0 ? (
              plans.map((plan, index) => {
                const currencySymbol = plan.currency === 'ZAR' ? 'R' : `${plan.currency} `;
                const formattedPrice = plan.currency === 'ZAR' ? `R${plan.totalPrice}` : `${plan.currency} ${plan.totalPrice}`;

                // Combine all details into the features list
                const allFeatures = [
                  ...(plan.descriptions || []),
                  `Invoice Limit: ${plan.invoiceLimit}`,
                  `User Limit: ${plan.userLimit}`,
                  `Storage: ${plan.storageCapacity}`,
                  parseFloat(plan.additionalInvoicePrice) > 0 ? `Extra Invoice: ${currencySymbol}${plan.additionalInvoicePrice}` : null,
                  ...(plan.modules ? plan.modules.filter(m => typeof m === 'object' ? m.enabled : true).map(m => typeof m === 'object' ? m.name : m) : [])
                ].filter(Boolean); // Remove null/undefined items

                // Determine Icon
                let PlanIcon = <Award size={32} color="var(--primary)" />;
                const lowerName = plan.name.toLowerCase();
                if (lowerName.includes('gold')) PlanIcon = <Crown size={36} color="#FFD700" fill="#FFD700" fillOpacity={0.2} />;
                else if (lowerName.includes('silver')) PlanIcon = <Award size={36} color="#C0C0C0" strokeWidth={2.5} />;
                else if (lowerName.includes('bronze')) PlanIcon = <Award size={36} color="#CD7F32" strokeWidth={2.5} />;

                return (
                  <PricingCard
                    key={plan.id}
                    icon={PlanIcon}
                    name={plan.name}
                    price={formattedPrice}
                    period={`/ ${plan.billingCycle}`}
                    description={plan.name === 'Enterprise' ? 'Custom solutions for larger organizations.' : `Comprehensive plan for your business needs.`}
                    features={allFeatures}
                    cta="Get Started"
                    popular={index === 1} // Mark second plan as popular by default
                    onAction={() => handleOpenRequestModal(plan)}
                  />
                );
              })
            ) : (
              <p>No plans available at the moment.</p>
            )}
          </div>
        </div>
      </section>

      {/* --- Plan Request Modal --- */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-md">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Plan Purchase Request</h2>
              <button className="close-btn" onClick={() => setShowRequestModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                  You are requesting the <strong>{selectedPlanForRequest?.name}</strong> plan. Please provide your details and we will get back to you.
                </p>

                <div className="space-y-4">
                  <div className="form-group mb-4">
                    <label className="block mb-1 font-semibold text-slate-700">Company Name</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="text"
                        name="companyName"
                        className="form-control"
                        style={{ paddingLeft: '40px', width: '100%', height: '45px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        placeholder="Enter Company Name"
                        value={requestFormData.companyName}
                        onChange={handleRequestInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label className="block mb-1 font-semibold text-slate-700">Email Address</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        style={{ paddingLeft: '40px', width: '100%', height: '45px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        placeholder="Enter Email Address"
                        value={requestFormData.email}
                        onChange={handleRequestInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label className="block mb-1 font-semibold text-slate-700">Billing Cycle</label>
                    <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                        <input
                          type="radio"
                          name="billingCycle"
                          value="Monthly"
                          checked={requestFormData.billingCycle === 'Monthly'}
                          onChange={handleRequestInputChange}
                        />
                        <span>Monthly</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                        <input
                          type="radio"
                          name="billingCycle"
                          value="Yearly"
                          checked={requestFormData.billingCycle === 'Yearly'}
                          onChange={handleRequestInputChange}
                        />
                        <span>Yearly</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label className="block mb-1 font-semibold text-slate-700">Start Date</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="date"
                        name="startDate"
                        className="form-control"
                        style={{ paddingLeft: '40px', width: '100%', height: '45px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        value={requestFormData.startDate}
                        onChange={handleRequestInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowRequestModal(false)} disabled={submittingRequest}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingRequest}>
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Supported Countries Section --- */}
      <section className="countries-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title" style={{ color: 'white', marginBottom: '10px' }}>Built for Southern Africa</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>Kiaan Technology natively supports local currencies and tax structures for seamless regional operations.</p>

          <div className="countries-grid">
            <div className="country-pill">
              <span className="currency-code">R</span>
              <span className="country-name">South Africa</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">NAD</span>
              <span className="country-name">Namibia</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">BWP</span>
              <span className="country-name">Botswana</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">LSL</span>
              <span className="country-name">Lesotho</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">SZL</span>
              <span className="country-name">Eswatini</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">ZMW</span>
              <span className="country-name">Zambia</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">ZiG</span>
              <span className="country-name">Zimbabwe</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">MZN</span>
              <span className="country-name">Mozambique</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">MWK</span>
              <span className="country-name">Malawi</span>
            </div>
            <div className="country-pill">
              <span className="currency-code">AOA</span>
              <span className="country-name">Angola</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Testimonials Section (New) --- */}
      <section id="testimonials" className="features" style={{ background: 'var(--bg-light)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trusted by Business Owners</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ color: '#fbbf24', marginBottom: '16px' }}>★★★★★</div>
              <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '24px', flexGrow: 1 }}>"Kiaan Technology transformed how we handle billing. The multi-currency support is fantastic for our regional clients."</p>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Michael D.</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Director, TechSolutions ZA</div>
              </div>
            </div>
            <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ color: '#fbbf24', marginBottom: '16px' }}>★★★★★</div>
              <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '24px', flexGrow: 1 }}>"Simple, fast, and professional. My clients love the invoices I send now. It looks very polished."</p>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Sarah J.</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Freelance Consultant</div>
              </div>
            </div>
            <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ color: '#fbbf24', marginBottom: '16px' }}>★★★★★</div>
              <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '24px', flexGrow: 1 }}>"The dashboard gives me a clear picture of my finances instantly. Highly recommended for any SME owner."</p>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>David K.</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Owner, K-Retail Botswana</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="cta-section">
        <div className="container cta-content">
          <h2>Start managing your business invoices today</h2>
          <p style={{ marginBottom: '40px', fontSize: '1.2rem', opacity: '0.9' }}>Join hundreds of businesses simplifying their finance operations with Kiaan Technology.</p>
          <div className="cta-buttons">
            <a href="#pricing" className="btn btn-primary btn-lg" style={{ backgroundColor: 'white', color: 'var(--primary-dark)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Get Started Now
            </a>
          </div>
        </div>
      </section>

      {/* --- Footer--- */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="logo" style={{ marginBottom: '20px' }}>
                <img src={fullLogo} alt="Kiaan Technology" style={{ height: '40px' }} />
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
                The smartest way to invoice, track payments, and manage financial health for modern businesses.
              </p>
            </div>

            <div className="footer-col">
              <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>Product</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#features" className='hover:text-white'>Features</a></li>
                <li><a href="#pricing" className='hover:text-white'>Pricing</a></li>
                <li><a href="#" className='hover:text-white'>Security</a></li>
                <li><a href="#" className='hover:text-white'>Updates</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>Company</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#about" className='hover:text-white'>About Us</a></li>
                <li><a href="#" className='hover:text-white'>Careers</a></li>
                <li><a href="#" className='hover:text-white'>Blog</a></li>
                <li><a href="#contact" className='hover:text-white'>Contact</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '1.1rem' }}>Connect</h3>
              <div className="social-links" style={{ display: 'flex', gap: '16px' }}>
                <div className="social-icon" style={{ cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                  <Facebook size={20} color="white" />
                </div>
                <div className="social-icon" style={{ cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                  <Twitter size={20} color="white" />
                </div>
                <div className="social-icon" style={{ cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                  <Linkedin size={20} color="white" />
                </div>
              </div>
              <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>📧 info@kiaantechnology.com</p>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>📞 +91 97521 00980</p>
            </div>
          </div>

          &copy; {new Date().getFullYear()} Kiaan Technology. All rights reserved. • Privacy Policy • Terms of Service
        </div>
      </footer>
    </div>
  );
};

// --- Sub-Components (Inline for simplicity) ---

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon-wrapper">
      {icon}
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
  </div>
);

const Step = ({ num, title, desc }) => (
  <div className="step-item">
    <div className="step-circle">
      {num}
    </div>
    <div className="step-card">
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  </div>
);

const PricingCard = ({ icon, name, price, period, description, features, cta, popular, onAction }) => (
  <div className={`pricing-card ${popular ? 'popular' : ''}`}>
    {popular && (
      <div style={{
        position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--primary)', color: 'white', padding: '4px 12px',
        borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase'
      }}>
        Most Popular
      </div>
    )}
    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>{name}</h3>
    <div className="price-tag">
      {price} <span className="price-period" style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{period}</span>
    </div>
    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{description}</p>

    <div className="feature-list">
      {features.map((feat, i) => (
        <div key={i} className="feature-item">
          <Check size={18} color="var(--primary)" strokeWidth={3} />
          <span>{feat}</span>
        </div>
      ))}
    </div>

    <button onClick={onAction} className={`btn ${popular ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%' }}>
      {cta}
    </button>
  </div>
);

const TestimonialCard = ({ quote, author, role }) => (
  <div className="feature-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ color: '#fbbf24', marginBottom: '16px' }}>★★★★★</div>
    <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '24px', flexGrow: 1 }}>"{quote}"</p>
    <div>
      <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{author}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{role}</div>
    </div>
  </div>
);

export default LandingPage;
