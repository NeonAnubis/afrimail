import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Shield,
  Zap,
  CheckCircle,
  Users,
  Globe,
  Lock,
  Clock,
  HardDrive,
  TrendingUp,
  ArrowRight,
  Star,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const features = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Military-grade encryption keeps your emails safe. Your data stays in Africa, governed by African data protection standards.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Optimized infrastructure across African data centers ensures instant delivery with 99.9% uptime, even in low-connectivity areas.',
    },
    {
      icon: HardDrive,
      title: 'Generous Storage',
      description:
        'Start with ample storage and scale up as you grow. Designed for Africa\'s growing digital economy.',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description:
        'Your data belongs to you and stays on African soil. We never scan emails for ads and comply with AU data protection conventions.',
    },
    {
      icon: Globe,
      title: 'Custom Domains',
      description:
        'Use your own domain or get a free @afrimail.com address. Build trust with an African email identity.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description:
        'Perfect for African businesses, NGOs, and teams. Shared mailboxes, aliases, and group management built for collaboration.',
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for individuals',
      features: [
        '2 GB storage',
        '100 emails per day',
        'Basic spam protection',
        'Mobile & desktop access',
        '@afrimail.com address',
        'Africa-based data centers',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Premium',
      price: 10,
      description: 'For professionals and small businesses',
      features: [
        '15 GB storage',
        'Unlimited emails per day',
        'Advanced spam protection',
        'Priority support',
        'Custom domain support',
        'Unlimited aliases',
        'Advanced analytics',
        'Africa-first routing',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: null,
      description: 'For organizations and large teams',
      features: [
        'Unlimited storage',
        'Unlimited sending',
        'Dedicated African infrastructure',
        'White-label options',
        'Custom integrations',
        'SLA guarantee',
        'Dedicated account manager',
        'Multi-country deployment',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: 'Amara Okafor',
      role: 'CEO, Lagos Tech Hub',
      content:
        'AfriMail has transformed how our startup communicates. Fast, reliable, and our data stays in Africa. It\'s the professional email solution we\'ve been waiting for.',
      rating: 5,
    },
    {
      name: 'Kwame Mensah',
      role: 'Freelance Developer, Accra',
      content:
        'Finally, an email service built for Africa! The connectivity is excellent even in areas with limited internet, and I love having an @afrimail.com address.',
      rating: 5,
    },
    {
      name: 'Fatima Hassan',
      role: 'NGO Director, Nairobi',
      content:
        'AfriMail gives us the reliability we need for our pan-African operations. The custom domain feature and team collaboration tools are perfect for our organization.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'How quickly can I get started?',
      answer:
        'You can create your @afrimail.com account in less than 2 minutes. Just choose your preferred name, verify your email, and start communicating across Africa immediately.',
    },
    {
      question: 'Why should I choose AfriMail over international providers?',
      answer:
        'AfriMail keeps your data on African soil, supports African infrastructure, and offers optimized routing for the continent. Plus, you get an authentic African digital identity with lower latency and better compliance with African data regulations.',
    },
    {
      question: 'Can I use my own domain?',
      answer:
        'Yes! You can use any domain you own. We provide simple DNS configuration instructions, and our African support team is ready to help you get set up quickly.',
    },
    {
      question: 'What about data security and privacy?',
      answer:
        'We take security seriously. All data is encrypted and stored in African data centers. We never scan your emails for advertising and comply with AU data protection frameworks and GDPR standards.',
    },
    {
      question: 'Do you support businesses across multiple African countries?',
      answer:
        'Absolutely! AfriMail is built for pan-African operations. Our infrastructure spans multiple African countries, and we offer multi-currency billing and local support across the continent.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'African Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '2M+', label: 'Emails Daily Across Africa' },
    { value: '35+', label: 'African Countries' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AfriMail</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link to={isAdmin ? '/admin' : '/dashboard'}>
                    <Button variant="ghost">
                      <User className="w-4 h-4 mr-2" />
                      {isAdmin ? (user as any).name : `${(user as any).first_name} ${(user as any).last_name}`}
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="primary">Get Started Free</Button>
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="pt-3 border-t flex flex-col gap-2">
                {user ? (
                  <>
                    <Link to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        {isAdmin ? (user as any).name : `${(user as any).first_name} ${(user as any).last_name}`}
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" className="w-full">
                        Get Started Free
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Trusted by 50,000+ users across Africa
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Africa's Own
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-yellow-600">
                {' '}
                Email Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Secure, reliable email hosting built specifically for the African continent. Keep your data in Africa, support African infrastructure, and connect with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Free Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Pricing
                </Button>
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Join Africa's email revolution
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Africa
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for secure, fast communication across the continent
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works best for you. All plans include core features.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl ${
                  tier.popular
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white ring-4 ring-blue-300 scale-105'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 text-sm font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    tier.popular ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`text-sm mb-6 ${
                    tier.popular ? 'text-blue-100' : 'text-gray-600'
                  }`}
                >
                  {tier.description}
                </p>
                <div className="mb-6">
                  {tier.price === null ? (
                    <div className={tier.popular ? 'text-white' : 'text-gray-900'}>
                      <span className="text-4xl font-bold">Custom</span>
                    </div>
                  ) : (
                    <div className={tier.popular ? 'text-white' : 'text-gray-900'}>
                      <span className="text-4xl font-bold">${tier.price}</span>
                      <span className={tier.popular ? 'text-blue-100' : 'text-gray-600'}>
                        /month
                      </span>
                    </div>
                  )}
                </div>
                <Link to="/signup">
                  <Button
                    variant={tier.popular ? 'secondary' : 'primary'}
                    className="w-full mb-6"
                  >
                    {tier.cta}
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {tier.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <CheckCircle
                        className={`w-5 h-5 flex-shrink-0 ${
                          tier.popular ? 'text-blue-200' : 'text-green-600'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          tier.popular ? 'text-blue-50' : 'text-gray-700'
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted Across the Continent
            </h2>
            <p className="text-xl text-gray-600">See what our customers have to say</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl border-2 border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.content}</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">Everything you need to know</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      activeFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-8 pb-6 text-gray-700 leading-relaxed">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 50,000+ Africans building their digital future. Create your account in minutes.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">AfriMail</span>
              </div>
              <p className="text-gray-400 text-sm">
                Africa's continental email platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to="/signup" className="hover:text-white transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 AfriMail. Africa's Own Email Platform. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Clock className="w-5 h-5 text-gray-400" />
              <Shield className="w-5 h-5 text-gray-400" />
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
