import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { FileText, ShieldCheck, CreditCard, AlertTriangle, Scale, Ban, Globe, Mail } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-10">
    <div className="flex items-center space-x-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-xl">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight text-white">{title}</h2>
    </div>
    <div className="text-gray-400 text-sm leading-relaxed space-y-3 pl-12">{children}</div>
  </div>
);

const Terms = () => (
  <div className="min-h-screen bg-black p-8 md:p-16">
    <SEO title="Terms & Conditions" description="TFC Terms of Service." />
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <Link to="/" className="text-primary text-xs font-black uppercase tracking-widest hover:underline">← Back to Home</Link>
        <h1 className="text-5xl font-black uppercase tracking-tighter mt-6 text-white">Terms & <span className="text-primary italic">Conditions</span></h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Last updated: April 23, 2026</p>
      </div>
      <div className="bg-surface border border-gray-800 rounded-3xl p-8 md:p-12">
        <p className="text-gray-400 text-sm leading-relaxed mb-10">Welcome to TFC (Total Full Contact Championship). These Terms govern your use of the TFC website, mobile application, and all related services. By using TFC, you agree to these Terms and our <Link to="/privacy-policy" className="text-primary hover:underline font-bold">Privacy Policy</Link>.</p>

        <Section icon={FileText} title="1. Acceptance of Terms">
          <p>By creating an account you confirm you are at least 13 years old and agree to these Terms. We may update Terms at any time; continued use means acceptance.</p>
        </Section>

        <Section icon={ShieldCheck} title="2. User Accounts">
          <p>You must maintain credential confidentiality, are responsible for all activity under your account, and must notify us of unauthorized use. We may suspend accounts violating these Terms.</p>
        </Section>

        <Section icon={CreditCard} title="3. Subscriptions & Payments">
          <p>TFC offers free and paid plans. Paid plans auto-renew unless cancelled. Payments processed via Stripe or NOWPayments. Crypto payments are non-refundable once confirmed. Refunds handled case-by-case via contact@tfc.events.</p>
        </Section>

        <Section icon={Scale} title="4. Content & Intellectual Property">
          <p>All content is property of TFC or its licensors. You may not download, copy, redistribute, screen-record, or re-upload any content without permission.</p>
        </Section>

        <Section icon={Globe} title="5. Champion Applications">
          <p>By applying, you confirm all info is accurate, grant TFC permission to display your approved profile publicly, and understand applications are reviewed at TFC's sole discretion.</p>
        </Section>

        <Section icon={Ban} title="6. Prohibited Activities">
          <p>You may not: use the Service illegally, gain unauthorized access, disrupt infrastructure, use bots/scrapers, impersonate others, upload malicious content, or circumvent security measures.</p>
        </Section>

        <Section icon={AlertTriangle} title="7. Limitation of Liability">
          <p>The Service is provided "AS IS" without warranties. TFC shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use.</p>
        </Section>

        <Section icon={FileText} title="8. Account Termination">
          <p>Delete your account any time via <Link to="/settings" className="text-primary hover:underline font-bold">Settings</Link> or <Link to="/delete-account" className="text-primary hover:underline font-bold">Delete Account</Link>. Deletion is permanent and irreversible. Cancel subscriptions beforehand.</p>
        </Section>

        <Section icon={Scale} title="9. Governing Law">
          <p>These Terms are governed by the laws of the United States. Disputes shall be resolved in the courts of California, United States.</p>
        </Section>

        <Section icon={Mail} title="10. Contact Us">
          <p><strong className="text-white">Company:</strong> TFC EVENTS LLC</p>
          <p><strong className="text-white">Email:</strong> <a href="mailto:contact@tfc.events" className="text-primary hover:underline">contact@tfc.events</a></p>
          <p><strong className="text-white">Phone:</strong> +1 (863) 331-3781</p>
          <p><strong className="text-white">Address:</strong> 15442 Ventura Blvd, Suite 201-2304, Sherman Oaks, CA 91403, United States</p>
          <p><strong className="text-white">Website:</strong> <a href="https://tfc.events" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tfc.events</a></p>
        </Section>
      </div>
    </div>
  </div>
);

export default Terms;
