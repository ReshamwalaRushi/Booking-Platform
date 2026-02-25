import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES_BUSINESS = [
  { icon: '📅', title: 'Smart Scheduling', desc: 'Manage your calendar with automated conflict detection and real-time availability.' },
  { icon: '💳', title: 'Online Payments', desc: 'Accept payments instantly via Stripe. Track revenue with detailed reports.' },
  { icon: '📧', title: 'Auto Notifications', desc: 'Keep clients informed with automated email and SMS reminders.' },
  { icon: '🎥', title: 'Zoom Integration', desc: 'Auto-create Zoom meetings for virtual appointments with one click.' },
  { icon: '⭐', title: 'Reviews & Ratings', desc: 'Build trust with verified client reviews displayed on your profile.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Track bookings, revenue, and completed appointments in real time.' },
];

const FEATURES_CLIENT = [
  { icon: '🔍', title: 'Easy Discovery', desc: 'Find the perfect service provider by category, location, and rating.' },
  { icon: '⚡', title: 'Instant Booking', desc: 'Book any service in seconds — no phone calls, no waiting on hold.' },
  { icon: '🗓️', title: 'Calendar Sync', desc: 'Sync your bookings to Google Calendar automatically.' },
  { icon: '✅', title: 'Review Services', desc: 'Leave honest reviews after your appointment to help others decide.' },
];

const PRICING_PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 business listing', 'Up to 50 bookings/month', 'Basic notifications', 'Client reviews'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: ['Unlimited bookings', 'Stripe payments', 'Zoom integration', 'Google Calendar sync', 'Advanced analytics', 'Priority support'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: 'per month',
    features: ['Everything in Pro', 'Multiple locations', 'Staff management', 'Custom branding', 'Dedicated account manager', 'API access'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Salon Owner', text: 'BookEase transformed how I manage my salon. No more missed appointments!', rating: 5, avatar: 'SM' },
  { name: 'James T.', role: 'Fitness Coach', text: 'My clients love how easy it is to book sessions. Revenue is up 40%!', rating: 5, avatar: 'JT' },
  { name: 'Dr. Priya K.', role: 'Dental Clinic', text: 'The automated reminders cut no-shows by 60%. Incredible platform.', rating: 5, avatar: 'PK' },
];

const STATS = [
  { value: '10,000+', label: 'Businesses', icon: '🏢' },
  { value: '500K+', label: 'Bookings Made', icon: '📅' },
  { value: '98%', label: 'Satisfaction', icon: '⭐' },
  { value: '50+', label: 'Countries', icon: '🌍' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.CLIENT,
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome back!');
      setAuthModal(null);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(regForm);
      toast.success('Account created successfully!');
      setAuthModal(null);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const closeModal = () => setAuthModal(null);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #080d1a 0%, #0a0f1e 100%)' }}>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 nav-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#home" className="flex items-center gap-2.5 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,.5)' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)' }}>
                BookEase
              </span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => setAuthModal('login')} className="btn-ghost text-sm">Log in</button>
              <button onClick={() => setAuthModal('register')} className="btn-primary text-sm px-5 py-2">Get Started Free →</button>
            </div>

            <button
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/8 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-white/8 flex flex-col gap-2 px-4">
                <button onClick={() => { setMobileMenuOpen(false); setAuthModal('login'); }} className="py-2.5 text-slate-300 font-medium text-center">Log in</button>
                <button
                  onClick={() => { setMobileMenuOpen(false); setAuthModal('register'); }}
                  className="btn-primary py-2.5 text-sm"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="pt-16 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 mb-8 badge-glow animate-pulse-glow">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            Trusted by 10,000+ businesses worldwide
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-none">
            <span className="text-white">Book Smarter,</span>
            <br />
            <span className="gradient-text">Grow Faster</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            The all-in-one booking platform for salons, clinics, consultants, and every service business.
            Accept bookings <span className="text-indigo-400 font-semibold">24/7</span>, automate reminders, and grow your revenue.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button onClick={() => setAuthModal('register')} className="btn-primary text-lg px-10 py-4">
              Start for Free — No credit card
            </button>
            <a href="#features" className="btn-secondary text-lg px-10 py-4">
              See How It Works
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="card-glass text-center p-5 hover:border-indigo-500/25 transition-all duration-300">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #c084fc)' }}>
                  {stat.value}
                </p>
                <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="badge-glow text-xs mb-4 inline-block">Features</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
              Everything you need to <span className="gradient-text">run your business</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Powerful tools for business owners, seamless experience for clients.</p>
          </div>

          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-indigo-500/30" />
              <span className="text-indigo-400 font-semibold text-sm uppercase tracking-wider">For Business Owners</span>
              <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-indigo-500/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES_BUSINESS.map((f) => (
                <div key={f.title} className="card-modern group cursor-default">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.2)' }}>
                    {f.icon}
                  </div>
                  <h4 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{f.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent to-purple-500/30" />
              <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">For Clients</span>
              <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent to-purple-500/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES_CLIENT.map((f) => (
                <div key={f.title} className="card-modern group cursor-default" style={{ borderColor: 'rgba(139,92,246,.2)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(139,92,246,.15)', border: '1px solid rgba(139,92,246,.25)' }}>
                    {f.icon}
                  </div>
                  <h4 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{f.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,102,241,.15), transparent)' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge-glow text-xs mb-4 inline-block">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Loved by businesses <span className="gradient-text">everywhere</span>
            </h2>
            <p className="text-slate-400 text-xl">Join thousands of satisfied business owners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card-glow hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 text-base leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge-glow text-xs mb-4 inline-block">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Simple, <span className="gradient-text">transparent</span> pricing
            </h2>
            <p className="text-xl text-slate-400">Start free, scale as you grow. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${plan.highlight ? '' : 'card'}`}
                style={plan.highlight ? {
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 20px 60px rgba(99,102,241,.4)',
                } : {}}
              >
                {plan.highlight && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-bold rounded-full">POPULAR</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className={`text-5xl font-black ${plan.highlight ? 'text-white' : 'gradient-text'}`}>{plan.price}</span>
                  <span className={`text-sm ml-1.5 ${plan.highlight ? 'text-indigo-200' : 'text-slate-500'}`}>/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? 'bg-white/20' : 'bg-indigo-500/20'}`}>
                        <svg className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white' : 'text-indigo-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className={plan.highlight ? 'text-indigo-100' : 'text-slate-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setAuthModal('register')}
                  className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 ${plan.highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'text-white'}`}
                  style={!plan.highlight ? {
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 15px rgba(99,102,241,.4)',
                  } : {}}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="badge-glow text-xs mb-5 inline-block">About Us</span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Built for businesses that care about their <span className="gradient-text">clients</span>
              </h2>
              <p className="text-lg text-slate-400 mb-5 leading-relaxed">
                BookEase was founded by business owners who were frustrated with clunky scheduling tools. We built the platform we always wanted — simple, powerful, and beautiful.
              </p>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Our mission is to help every service business offer a seamless booking experience that keeps clients coming back.
              </p>
              <button onClick={() => setAuthModal('register')} className="btn-primary px-8 py-3.5 text-base">
                Join BookEase →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎯', title: 'Our Mission', desc: 'Empower every service business with world-class booking technology.' },
                { icon: '💡', title: 'Our Vision', desc: 'A world where scheduling is effortless for businesses and clients alike.' },
                { icon: '🤝', title: 'Our Values', desc: 'Simplicity, reliability, and delight in every interaction.' },
                { icon: '🚀', title: 'Our Growth', desc: "From 0 to 10,000+ businesses in under 2 years. We're just getting started." },
              ].map((item) => (
                <div key={item.title} className="card-modern p-5">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-bold text-white mb-1.5">{item.title}</h4>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="badge-glow text-xs mb-4 inline-block">Contact</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Get in <span className="gradient-text">touch</span>
            </h2>
            <p className="text-xl text-slate-400">Have questions? We would love to hear from you.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-6">
              {[
                { icon: '📧', label: 'Email', value: 'hello@bookease.io' },
                { icon: '📞', label: 'Phone', value: '+1 (800) BOOKEASE' },
                { icon: '📍', label: 'Address', value: '123 Tech Ave, San Francisco, CA 94107' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.25)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{item.label}</p>
                    <p className="text-white font-semibold mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-glow">
              {contactSent ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-slate-400">We will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Name</label>
                    <input type="text" required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="input-field" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
                    <input type="email" required value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="input-field" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Message</label>
                    <textarea required rows={4} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} className="input-field resize-none" placeholder="How can we help?" />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 text-sm font-bold">Send Message</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.15) 0%, rgba(139,92,246,.15) 100%)', borderTop: '1px solid rgba(99,102,241,.2)', borderBottom: '1px solid rgba(99,102,241,.2)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Ready to <span className="gradient-text">transform</span> your business?
          </h2>
          <p className="text-xl text-slate-400 mb-8">Join 10,000+ businesses already using BookEase. Start free, no credit card required.</p>
          <button onClick={() => setAuthModal('register')} className="btn-primary text-lg px-12 py-4">
            Start Your Free Trial →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-white">BookEase</span>
            </div>
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} BookEase. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="text-slate-500 hover:text-white transition-colors">{link.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(99,102,241,.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {authModal === 'login' ? 'Welcome back 👋' : 'Create your account'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {authModal === 'login' ? 'Sign in to your BookEase account' : 'Join thousands of businesses on BookEase'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex p-1 m-4 mb-0 rounded-xl" style={{ background: 'rgba(255,255,255,.05)' }}>
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAuthModal(tab)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${authModal === tab ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                  style={authModal === tab ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,.4)' } : {}}
                >
                  {tab === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {authModal === 'login' && (
              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
                  <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                  <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="input-field" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm font-bold mt-2">
                  {isLoading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>
            )}

            {authModal === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">First name</label>
                    <input type="text" required value={regForm.firstName} onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })} className="input-field text-sm" placeholder="Jane" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Last name</label>
                    <input type="text" required value={regForm.lastName} onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })} className="input-field text-sm" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
                  <input type="email" required value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} className="input-field text-sm" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
                  <input type="password" required value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} className="input-field text-sm" placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Phone</label>
                  <input type="tel" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} className="input-field text-sm" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">I am a…</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([UserRole.CLIENT, UserRole.BUSINESS_OWNER] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegForm({ ...regForm, role: r })}
                        className={`py-2.5 text-sm font-semibold rounded-xl border transition-all ${regForm.role === r ? 'text-white border-indigo-500' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
                        style={regForm.role === r ? { background: 'rgba(99,102,241,.2)' } : {}}
                      >
                        {r === UserRole.CLIENT ? '👤 Client' : '🏢 Business'}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-sm font-bold">
                  {isLoading ? 'Creating account…' : 'Create Account →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
