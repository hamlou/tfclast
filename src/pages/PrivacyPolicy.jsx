import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Shield, Database, Eye, Trash2, Mail, Lock, Globe, UserCheck } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-10">
    <div className="flex items-center space-x-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-xl">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight text-white">{title}</h2>
    </div>
    <div className="text-gray-400 text-sm leading-relaxed space-y-3 pl-12">
      {children}
    </div>
  </div>
);

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black p-8 md:p-16">
      <SEO title="Privacy Policy" description="TFC Privacy Policy — Learn how we collect, use, and protect your personal data." />
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Link to="/" className="text-primary text-xs font-black uppercase tracking-widest hover:underline">← Back to Home</Link>
          <h1 className="text-5xl font-black uppercase tracking-tighter mt-6 text-white">Privacy <span className="text-primary italic">Policy</span></h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Last updated: April 23, 2026</p>
        </div>

        <div className="bg-surface border border-gray-800 rounded-3xl p-8 md:p-12">
          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            Total Full Contact Championship ("TFC", "we", "our", or "us") operates the TFC website and mobile application (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this policy carefully. By using TFC, you agree to the collection and use of information in accordance with this policy.
          </p>

          <Section icon={Database} title="Information We Collect">
            <p><strong className="text-white">Personal Information:</strong> When you create an account, we collect your name, email address, and password. If you sign in with Google, we receive your Google profile name and email.</p>
            <p><strong className="text-white">Profile Information:</strong> If you apply to become a TFC Champion, we additionally collect your phone number, date of birth, country, height, weight, fight record, profile photo, association, social media links, and fighting organization.</p>
            <p><strong className="text-white">Payment Information:</strong> When you subscribe to a paid plan, payment is processed securely through Stripe or NOWPayments. We do not store your credit card numbers or cryptocurrency wallet addresses on our servers. We only store your Stripe customer ID and subscription status.</p>
            <p><strong className="text-white">Usage Data:</strong> We collect information about how you use the Service, including watch history, saved content lists, and settings preferences. This data is stored locally on your device.</p>
            <p><strong className="text-white">Device Information:</strong> We may collect device type, operating system, and browser type for analytics and service improvement.</p>
          </Section>

          <Section icon={Eye} title="How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Create and manage your account</li>
              <li>Process subscriptions and payments</li>
              <li>Provide and maintain the Service</li>
              <li>Send you account-related communications (verification emails, password resets)</li>
              <li>Review Champion applications</li>
              <li>Respond to contact form inquiries</li>
              <li>Improve and optimize our Service</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </Section>

          <Section icon={Lock} title="Data Storage & Security">
            <p>Your data is stored securely using <strong className="text-white">Google Firebase</strong> (Firestore database and Authentication), which provides enterprise-grade security including encryption at rest and in transit. Profile images are hosted on <strong className="text-white">ImgBB</strong>.</p>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>SSL/TLS encryption for all data in transit</li>
              <li>Firebase security rules for database access control</li>
              <li>Token-based authentication (Firebase ID tokens)</li>
              <li>Rate limiting on API endpoints</li>
              <li>Secure HTTP headers via Helmet.js</li>
            </ul>
          </Section>

          <Section icon={Globe} title="Third-Party Services">
            <p>We use the following third-party services that may have access to your data:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Google Firebase:</strong> Authentication and data storage</li>
              <li><strong className="text-white">Stripe:</strong> Payment processing for subscriptions</li>
              <li><strong className="text-white">NOWPayments:</strong> Cryptocurrency payment processing</li>
              <li><strong className="text-white">Resend:</strong> Transactional email delivery</li>
              <li><strong className="text-white">ImgBB:</strong> Image hosting for champion profile photos</li>
              <li><strong className="text-white">YouTube:</strong> Video content embedding</li>
            </ul>
            <p>Each of these services has their own privacy policies governing their use of your data.</p>
          </Section>

          <Section icon={UserCheck} title="Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Access</strong> your personal data at any time through your profile and settings</li>
              <li><strong className="text-white">Update</strong> your personal information through your account settings</li>
              <li><strong className="text-white">Delete</strong> your account and all associated data (see below)</li>
              <li><strong className="text-white">Export</strong> your data by contacting us at contact@tfc.events</li>
              <li><strong className="text-white">Withdraw consent</strong> at any time by deleting your account</li>
            </ul>
          </Section>

          <Section icon={Trash2} title="Account Deletion">
            <p>You can permanently delete your account and all associated data at any time by navigating to <Link to="/settings" className="text-primary hover:underline font-bold">Settings → Delete Account</Link>, or by visiting the <Link to="/delete-account" className="text-primary hover:underline font-bold">Delete Account</Link> page.</p>
            <p>When you delete your account, the following data is permanently removed:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your user profile and authentication credentials</li>
              <li>Your Firestore user document (subscription status, preferences)</li>
              <li>Your locally stored watch history and saved lists</li>
              <li>Any champion application associated with your email</li>
            </ul>
            <p>Deletion is immediate and irreversible. If you have an active Stripe subscription, you should cancel it before deleting your account, or contact us for assistance.</p>
          </Section>

          <Section icon={Mail} title="Contact Us">
            <p>If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us:</p>
            <p><strong className="text-white">Company:</strong> TFC EVENTS LLC</p>
            <p><strong className="text-white">Email:</strong> <a href="mailto:contact@tfc.events" className="text-primary hover:underline">contact@tfc.events</a></p>
            <p><strong className="text-white">Phone:</strong> +1 (863) 331-3781</p>
            <p><strong className="text-white">Address:</strong> 15442 Ventura Blvd, Suite 201-2304, Sherman Oaks, CA 91403, United States</p>
          </Section>

          {/* Data Safety Section for Google Play */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Data Safety <span className="text-green-400 italic">Summary</span></h2>
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">Google Play Data Safety Declaration</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Data Type</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Collected</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Purpose</th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Shared</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800/50">
                    <td className="p-4 font-bold text-white">Name</td>
                    <td className="p-4"><span className="text-green-400 text-xs font-black">Yes</span></td>
                    <td className="p-4">Account creation, champion profile</td>
                    <td className="p-4"><span className="text-gray-600 text-xs font-black">No</span></td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="p-4 font-bold text-white">Email Address</td>
                    <td className="p-4"><span className="text-green-400 text-xs font-black">Yes</span></td>
                    <td className="p-4">Authentication, account communications</td>
                    <td className="p-4"><span className="text-gray-600 text-xs font-black">No</span></td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="p-4 font-bold text-white">Phone Number</td>
                    <td className="p-4"><span className="text-yellow-400 text-xs font-black">Optional</span></td>
                    <td className="p-4">Champion application only</td>
                    <td className="p-4"><span className="text-gray-600 text-xs font-black">No</span></td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="p-4 font-bold text-white">Date of Birth</td>
                    <td className="p-4"><span className="text-yellow-400 text-xs font-black">Optional</span></td>
                    <td className="p-4">Champion application only</td>
                    <td className="p-4"><span className="text-gray-600 text-xs font-black">No</span></td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="p-4 font-bold text-white">Country</td>
                    <td className="p-4"><span className="text-yellow-400 text-xs font-black">Optional</span></td>
                    <td className="p-4">Champion profile display</td>
                    <td className="p-4"><span className="text-green-400 text-xs font-black">Public</span></td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="p-4 font-bold text-white">Profile Photo</td>
                    <td className="p-4"><span className="text-yellow-400 text-xs font-black">Optional</span></td>
                    <td className="p-4">Champion profile display</td>
                    <td className="p-4"><span className="text-green-400 text-xs font-black">Public</span></td>
                  </tr>
                  <tr className="border-b border-gray-800/50">
                    <td className="p-4 font-bold text-white">Payment Info</td>
                    <td className="p-4"><span className="text-green-400 text-xs font-black">Yes</span></td>
                    <td className="p-4">Subscription processing (via Stripe)</td>
                    <td className="p-4"><span className="text-yellow-400 text-xs font-black">Stripe</span></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-white">Watch History</td>
                    <td className="p-4"><span className="text-green-400 text-xs font-black">Yes</span></td>
                    <td className="p-4">Personalization (stored locally)</td>
                    <td className="p-4"><span className="text-gray-600 text-xs font-black">No</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-green-500/5 border border-green-900/40 rounded-2xl p-6">
              <p className="text-gray-300 text-sm leading-relaxed">
                <strong className="text-green-400">Data Encryption:</strong> All data is encrypted in transit (TLS) and at rest (Firebase). No data is sold to third parties. Users can delete their data at any time via the Settings page or the dedicated <Link to="/delete-account" className="text-primary hover:underline font-bold">Account Deletion</Link> page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
