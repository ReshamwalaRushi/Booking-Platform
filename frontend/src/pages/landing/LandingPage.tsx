import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
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
  { name: 'Sarah M.', role: 'Salon Owner', text: 'BookEase transformed how I manage my salon. No more missed appointments!', rating: 5 },
  { name: 'James T.', role: 'Fitness Coach', text: 'My clients love how easy it is to book sessions. Revenue is up 40%!', rating: 5 },
  { name: 'Dr. Priya K.', role: 'Dental Clinic', text: 'The automated reminders cut no-shows by 60%. Incredible platform.', rating: 5 },
];

const STATS = [
  { value: '10,000+', label: 'Businesses' },
  { value: '500K+', label: 'Bookings Made' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '50+', label: 'Countries' },
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BookEase</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                  {link.label}
                </a>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2">
                Log in
              </Link>
              <Link to="/register" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm">
                Get Started Free
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 px-4">
                <Link to="/login" className="block text-center py-2 text-gray-700 font-medium">Log in</Link>
                <Link to="/register" className="block text-center py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg">
                  Get Started Free
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-16 min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Trusted by 10,000+ businesses worldwide
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Book Smarter,{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Grow Faster
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one booking platform for salons, clinics, consultants, and every service business. Accept bookings 24/7, automate reminders, and grow your revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start for Free →
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-800 text-lg font-semibold rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to run your business</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Powerful tools for business owners, seamless experience for clients.</p>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">For Business Owners</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES_BUSINESS.map((f) => (
                <div key={f.title} className="p-6 border border-gray-100 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{f.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">For Clients</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES_CLIENT.map((f) => (
                <div key={f.title} className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl hover:shadow-md transition-all">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Loved by businesses everywhere</h2>
            <p className="text-blue-200 text-xl">Join thousands of satisfied business owners</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-yellow-400 text-xl mb-3">{'★'.repeat(t.rating)}</div>
                <p className="text-white text-base leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold">{t.name}</p>
                  <p className="text-blue-200 text-sm">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-500">Start free, scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${plan.highlight
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl scale-105'
                  : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className={plan.highlight ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-all ${plan.highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Built for businesses that care about their clients</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                BookEase was founded by business owners who were frustrated with clunky scheduling tools. We built the platform we always wanted — simple, powerful, and beautiful.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our mission is to help every service business — no matter the size — offer a seamless booking experience that keeps clients coming back.
              </p>
              <div className="flex gap-4">
                <Link to="/register" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
                  Join BookEase →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎯', title: 'Our Mission', desc: 'Empower every service business with world-class booking technology.' },
                { icon: '💡', title: 'Our Vision', desc: 'A world where scheduling is effortless for businesses and clients alike.' },
                { icon: '🤝', title: 'Our Values', desc: 'Simplicity, reliability, and delight in every interaction.' },
                { icon: '🚀', title: 'Our Growth', desc: 'From 0 to 10,000+ businesses in under 2 years. We\'re just getting started.' },
              ].map((item) => (
                <div key={item.title} className="p-5 bg-gray-50 rounded-2xl">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in touch</h2>
            <p className="text-xl text-gray-500">Have questions? We'd love to hear from you.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-6">
              {[
                { icon: '📧', label: 'Email', value: 'hello@bookease.io' },
                { icon: '📞', label: 'Phone', value: '+1 (800) BOOKEASE' },
                { icon: '📍', label: 'Address', value: '123 Tech Ave, San Francisco, CA 94107' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{item.label}</p>
                    <p className="text-gray-900 font-semibold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {contactSent ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">BookEase</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} BookEase. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="hover:text-white transition-colors">{link.label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
