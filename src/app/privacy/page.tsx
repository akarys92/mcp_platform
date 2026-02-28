import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy - Einstellen Connect",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              &larr; Back to Login
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: February 25, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-sm text-foreground">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">1. Introduction</h2>
              <p className="text-muted-foreground">
                Einstellen Connect (&quot;we&quot;, &quot;our&quot;, or
                &quot;us&quot;) provides an internal business platform for
                authorized personnel. This Privacy Policy describes how we
                collect, use, and protect your information when you use our
                services.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                2. Information We Collect
              </h2>
              <h3 className="font-medium">Account Information</h3>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Email address</li>
                <li>Authentication credentials</li>
                <li>Access level and permissions</li>
              </ul>
              <h3 className="font-medium">Usage Data</h3>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>System activity logs for security and compliance</li>
                <li>Authentication events (sign-in, sign-out, password changes)</li>
              </ul>
              <h3 className="font-medium">Operational Data</h3>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  Data necessary to support internal business operations and
                  authorized workflows
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground">We use your information to:</p>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Authenticate you and manage access</li>
                <li>Provide and improve internal services</li>
                <li>Enforce permissions set by your organization</li>
                <li>Maintain security and compliance records</li>
                <li>Diagnose and resolve technical issues</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">4. Data Storage and Security</h2>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  User data is stored in secure, access-controlled systems
                </li>
                <li>Credentials are protected using industry-standard methods</li>
                <li>
                  All communication between your browser and our systems uses
                  TLS encryption
                </li>
                <li>
                  Access to data is restricted based on your
                  organization&apos;s role and permission configuration
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
              <p className="text-muted-foreground">
                We may rely on third-party service providers to support
                infrastructure, security, and operational needs. These providers
                process data on our behalf under contractual safeguards. Each
                provider is governed by its own privacy policy and terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">6. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your account data for as long as your account is
                active. Audit logs are retained for compliance purposes as
                configured by your organization&apos;s administrator. When your
                account is deactivated, your personal data will be deleted
                within 30 days, except where retention is required by law.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">7. Your Rights</h2>
              <p className="text-muted-foreground">
                Depending on your jurisdiction, you may have the right to:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-muted-foreground">
                To exercise these rights, contact your organization&apos;s
                administrator or reach out to us at{" "}
                <a
                  href="mailto:privacy@einstellen.io"
                  className="text-primary underline"
                >
                  privacy@einstellen.io
                </a>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                8. Changes to This Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will
                notify you of material changes by posting the updated policy on
                this page with a revised &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact
                us at{" "}
                <a
                  href="mailto:privacy@einstellen.io"
                  className="text-primary underline"
                >
                  privacy@einstellen.io
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            End User Agreement
          </Link>
        </div>
      </div>
    </div>
  );
}
