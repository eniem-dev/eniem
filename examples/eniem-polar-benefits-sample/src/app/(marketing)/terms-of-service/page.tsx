import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.TermsOfServicePage.metadata.title,
  description: locales.TermsOfServicePage.metadata.description,
});

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        {locales.TermsOfServicePage.title}
      </h1>
      <p className="text-muted-foreground mb-8">
        {locales.TermsOfServicePage.lastUpdated} [EFFECTIVE_DATE]
      </p>

      <div className="prose dark:prose-invert max-w-none">
        <p>
          Welcome to [APP_NAME]. These Terms of Service (&quot;Terms&quot;) govern your
          access to and use of the [APP_NAME] website, applications, and services
          (collectively, the &quot;Service&quot;) provided by [COMPANY_NAME]
          (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
        </p>

        <p>
          By accessing or using our Service, you agree to be bound by these Terms.
          If you do not agree to these Terms, please do not use our Service.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account or using any part of the Service, you acknowledge
          that you have read, understood, and agree to be bound by these Terms and
          our Privacy Policy. If you are using the Service on behalf of an
          organization, you represent that you have the authority to bind that
          organization to these Terms.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          [APP_NAME] provides [BRIEF_SERVICE_DESCRIPTION]. We reserve the right to
          modify, suspend, or discontinue any aspect of the Service at any time
          without prior notice.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          To access certain features of the Service, you may be required to create
          an account. You agree to:
        </p>
        <ul>
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain and promptly update your account information</li>
          <li>Keep your password secure and confidential</li>
          <li>Accept responsibility for all activities that occur under your account</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
        </ul>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon the rights of others</li>
          <li>Transmit harmful, offensive, or inappropriate content</li>
          <li>Attempt to gain unauthorized access to our systems or networks</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Use automated means to access the Service without permission</li>
          <li>Engage in any activity that could damage, disable, or impair the Service</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are
          owned by [COMPANY_NAME] and are protected by international copyright,
          trademark, patent, trade secret, and other intellectual property laws.
          You may not copy, modify, distribute, sell, or lease any part of our
          Service without our prior written consent.
        </p>

        <h2>6. User Content</h2>
        <p>
          You retain ownership of any content you submit, post, or display on or
          through the Service (&quot;User Content&quot;). By submitting User Content, you
          grant us a worldwide, non-exclusive, royalty-free license to use,
          reproduce, modify, and distribute your User Content in connection with
          operating and improving the Service.
        </p>

        <h2>7. Payment Terms</h2>
        <p>
          If you purchase a subscription or other paid features, you agree to pay
          all applicable fees. All payments are non-refundable except as required
          by law or as explicitly stated in these Terms. We reserve the right to
          change our pricing at any time with reasonable notice.
        </p>

        <h2>8. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the Service
          immediately, without prior notice or liability, for any reason,
          including if you breach these Terms. Upon termination, your right to use
          the Service will cease immediately. You may also terminate your account
          at any time by contacting us at [CONTACT_EMAIL].
        </p>

        <h2>9. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, [COMPANY_NAME] SHALL NOT BE
          LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY
          OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
          LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
        </p>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless [COMPANY_NAME] and its
          officers, directors, employees, and agents from any claims, damages,
          losses, liabilities, and expenses (including attorney&apos;s fees) arising
          out of your use of the Service or violation of these Terms.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of [JURISDICTION], without regard to its conflict of law
          provisions. Any disputes arising under these Terms shall be resolved
          exclusively in the courts located in [JURISDICTION].
        </p>

        <h2>13. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify
          you of any changes by posting the new Terms on this page and updating
          the &quot;Last updated&quot; date. Your continued use of the Service after any
          changes constitutes acceptance of the new Terms.
        </p>

        <h2>14. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at{" "}
          <a href="mailto:[CONTACT_EMAIL]">[CONTACT_EMAIL]</a>.
        </p>
      </div>
    </div>
  );
}
