import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.PrivacyPage.metadata.title,
  description: locales.PrivacyPage.metadata.description,
});

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        {locales.PrivacyPage.title}
      </h1>
      <p className="text-muted-foreground mb-8">
        {locales.PrivacyPage.lastUpdated} [EFFECTIVE_DATE]
      </p>

      <div className="prose dark:prose-invert max-w-none">
        <p>
          [COMPANY_NAME] (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to
          protecting your privacy. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our [APP_NAME]
          website and services (collectively, the &quot;Service&quot;).
        </p>

        <p>
          Please read this Privacy Policy carefully. By using the Service, you
          consent to the collection and use of your information as described in
          this policy.
        </p>

        <h2>1. Information We Collect</h2>

        <h3>Personal Information</h3>
        <p>We may collect personally identifiable information that you provide to us, including but not limited to:</p>
        <ul>
          <li>Name and email address</li>
          <li>Account credentials</li>
          <li>Payment information (processed securely through third-party providers)</li>
          <li>Profile information you choose to provide</li>
          <li>Communications you send to us</li>
        </ul>

        <h3>Automatically Collected Information</h3>
        <p>When you access the Service, we may automatically collect:</p>
        <ul>
          <li>Device information (type, operating system, browser)</li>
          <li>IP address and general location</li>
          <li>Usage data (pages visited, features used, time spent)</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h3>Blockchain Information</h3>
        <p>
          If you use Web3 authentication features, we may collect your public
          wallet address. We do not have access to your private keys or the
          ability to control your wallet.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Process transactions and send related information</li>
          <li>Send administrative messages, updates, and security alerts</li>
          <li>Respond to your comments, questions, and requests</li>
          <li>Monitor and analyze trends, usage, and activities</li>
          <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
          <li>Personalize and improve your experience</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>3. Sharing of Information</h2>
        <p>We may share your information in the following circumstances:</p>
        <ul>
          <li>
            <strong>Service Providers:</strong> With third-party vendors who
            perform services on our behalf (payment processing, hosting, analytics)
          </li>
          <li>
            <strong>Legal Requirements:</strong> When required by law or to respond
            to legal process
          </li>
          <li>
            <strong>Protection:</strong> To protect the rights, property, and
            safety of [COMPANY_NAME], our users, or others
          </li>
          <li>
            <strong>Business Transfers:</strong> In connection with a merger,
            acquisition, or sale of assets
          </li>
          <li>
            <strong>Consent:</strong> With your consent or at your direction
          </li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h2>4. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to collect information
          and improve the Service. You can control cookies through your browser
          settings. Note that disabling cookies may affect some features of the
          Service.
        </p>
        <p>We use the following types of cookies:</p>
        <ul>
          <li>
            <strong>Essential Cookies:</strong> Required for the Service to
            function properly
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand how users
            interact with the Service
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your settings and
            preferences
          </li>
        </ul>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational security measures
          to protect your information against unauthorized access, alteration,
          disclosure, or destruction. However, no method of transmission over the
          Internet or electronic storage is 100% secure, and we cannot guarantee
          absolute security.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your information for as long as your account is active or as
          needed to provide you with the Service. We may also retain information
          as required by law or for legitimate business purposes (e.g., resolving
          disputes, enforcing agreements).
        </p>

        <h2>7. Your Rights and Choices</h2>
        <p>Depending on your location, you may have certain rights regarding your personal information:</p>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of your personal information
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate information
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal information
          </li>
          <li>
            <strong>Portability:</strong> Request transfer of your information to another service
          </li>
          <li>
            <strong>Opt-out:</strong> Unsubscribe from marketing communications
          </li>
        </ul>
        <p>
          To exercise these rights, please contact us at [CONTACT_EMAIL]. We will
          respond to your request within a reasonable timeframe.
        </p>

        <h2>8. Children&apos;s Privacy</h2>
        <p>
          The Service is not intended for children under the age of 13 (or 16 in
          certain jurisdictions). We do not knowingly collect personal information
          from children. If you believe we have collected information from a
          child, please contact us immediately.
        </p>

        <h2>9. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other
          than your country of residence. These countries may have data protection
          laws that are different from your country. We take appropriate measures
          to ensure your information remains protected.
        </p>

        <h2>10. Third-Party Links</h2>
        <p>
          The Service may contain links to third-party websites or services. We
          are not responsible for the privacy practices of these third parties. We
          encourage you to review their privacy policies before providing any
          information.
        </p>

        <h2>11. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page and
          updating the &quot;Last updated&quot; date. Your continued use of the Service
          after any changes constitutes acceptance of the new Privacy Policy.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data
          practices, please contact us at:
        </p>
        <ul>
          <li>Email: <a href="mailto:[CONTACT_EMAIL]">[CONTACT_EMAIL]</a></li>
          <li>Website: [WEBSITE_URL]</li>
        </ul>
      </div>
    </div>
  );
}
