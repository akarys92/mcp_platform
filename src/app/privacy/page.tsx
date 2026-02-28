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
                &quot;us&quot;) provides an MCP (Model Context Protocol) server
                that connects Claude AI to your organization&apos;s business
                tools. This Privacy Policy describes how we collect, use, and
                protect your information when you use our platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                2. Information We Collect
              </h2>
              <h3 className="font-medium">Account Information</h3>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Email address</li>
                <li>Hashed password credentials</li>
                <li>User role and permissions</li>
              </ul>
              <h3 className="font-medium">Usage Data</h3>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  Audit logs of tool invocations (which tools were called, when,
                  and by whom)
                </li>
                <li>OAuth authorization events</li>
                <li>Authentication events (sign-in, sign-out, password changes)</li>
              </ul>
              <h3 className="font-medium">Business Tool Data</h3>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  Data retrieved from connected third-party services (e.g.
                  QuickBooks, Google Drive, DocuSign) is passed through our
                  server to Claude AI on your behalf
                </li>
                <li>
                  OAuth tokens for connected services are stored securely to
                  maintain your sessions
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground">We use your information to:</p>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Authenticate you and manage access to the platform</li>
                <li>
                  Route requests between Claude AI and your connected business
                  tools
                </li>
                <li>
                  Enforce permission controls set by your organization&apos;s
                  administrator
                </li>
                <li>
                  Maintain audit logs for security and compliance purposes
                </li>
                <li>Diagnose and resolve technical issues</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">4. Data Storage and Security</h2>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  User data is stored in Supabase with row-level security
                  policies
                </li>
                <li>Passwords are hashed and never stored in plaintext</li>
                <li>
                  All communication between your browser, our server, and
                  third-party services uses TLS encryption
                </li>
                <li>
                  OAuth tokens for third-party services are stored encrypted at
                  rest
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
                Einstellen Connect integrates with third-party services on your
                behalf. When you connect a service, data flows between that
                service and Claude AI through our platform. Each third-party
                service is governed by its own privacy policy and terms. We
                encourage you to review those policies.
              </p>
              <p className="text-muted-foreground">
                We use the following infrastructure providers:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  <strong>Supabase</strong> &mdash; authentication and database
                </li>
                <li>
                  <strong>Vercel</strong> &mdash; application hosting
                </li>
                <li>
                  <strong>Anthropic</strong> &mdash; Claude AI (via MCP
                  protocol)
                </li>
              </ul>
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
