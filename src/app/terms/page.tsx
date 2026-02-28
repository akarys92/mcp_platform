import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "End User Agreement - Einstellen Connect",
};

export default function TermsPage() {
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
            <CardTitle className="text-2xl">End User Agreement</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: February 25, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6 text-sm text-foreground">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing or using Einstellen Connect (&quot;the
                Service&quot;), you agree to be bound by this End User Agreement
                (&quot;Agreement&quot;). If you do not agree to these terms, do
                not use the Service. Your continued use of the Service
                constitutes acceptance of any updates to this Agreement.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground">
                Einstellen Connect is an MCP (Model Context Protocol) server
                that enables Claude AI to interact with your organization&apos;s
                business tools, including but not limited to QuickBooks, Google
                Drive, DocuSign, and other connected services. The Service
                provides authentication, authorization, permission management,
                and audit logging for these integrations.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">3. User Accounts</h2>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  Accounts are created by your organization&apos;s
                  administrator. You are responsible for maintaining the
                  confidentiality of your credentials.
                </li>
                <li>
                  You must change your temporary password upon first login.
                </li>
                <li>
                  You must not share your account credentials or allow others to
                  access the Service through your account.
                </li>
                <li>
                  You must promptly notify your administrator of any
                  unauthorized use of your account.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">4. Acceptable Use</h2>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  Use the Service for any unlawful purpose or in violation of
                  any applicable laws or regulations
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the Service
                  or connected third-party systems
                </li>
                <li>
                  Interfere with or disrupt the integrity or performance of the
                  Service
                </li>
                <li>
                  Reverse engineer, decompile, or disassemble any part of the
                  Service
                </li>
                <li>
                  Use the Service to transmit malicious code, spam, or harmful
                  content
                </li>
                <li>
                  Circumvent any access controls, permission restrictions, or
                  rate limits
                </li>
                <li>
                  Access tools or data beyond the permissions granted by your
                  administrator
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                5. Third-Party Integrations
              </h2>
              <p className="text-muted-foreground">
                The Service connects to third-party business tools on your
                behalf. By authorizing a connection, you grant Einstellen
                Connect permission to access and relay data between that service
                and Claude AI within the scope of your assigned permissions.
              </p>
              <p className="text-muted-foreground">
                We are not responsible for the availability, accuracy, or
                policies of third-party services. Your use of third-party
                services through Einstellen Connect remains subject to those
                services&apos; own terms and conditions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">6. Data and Privacy</h2>
              <p className="text-muted-foreground">
                Your use of the Service is also governed by our{" "}
                <Link
                  href="/privacy"
                  className="text-primary underline"
                >
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your data.
                All tool invocations and data access are logged for audit
                purposes.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                7. Intellectual Property
              </h2>
              <p className="text-muted-foreground">
                The Service, including its code, design, and documentation, is
                the property of Einstellen and is protected by applicable
                intellectual property laws. This Agreement does not grant you
                any rights to our trademarks, logos, or branding.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
                AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
                OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
                UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                9. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, EINSTELLEN SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, WHETHER
                INCURRED DIRECTLY OR INDIRECTLY, ARISING FROM YOUR USE OF THE
                SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY
                YOUR ORGANIZATION FOR THE SERVICE IN THE TWELVE MONTHS
                PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                10. Indemnification
              </h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Einstellen, its
                officers, employees, and agents from any claims, damages, or
                expenses arising from your use of the Service, your violation of
                this Agreement, or your violation of any rights of a third
                party.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">11. Termination</h2>
              <p className="text-muted-foreground">
                Your organization&apos;s administrator may deactivate your
                account at any time. We reserve the right to suspend or
                terminate access to the Service for violations of this
                Agreement. Upon termination, your right to use the Service
                ceases immediately.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                12. Changes to This Agreement
              </h2>
              <p className="text-muted-foreground">
                We may modify this Agreement at any time. Material changes will
                be communicated through the Service or via your
                organization&apos;s administrator. Your continued use of the
                Service after changes take effect constitutes acceptance of the
                revised Agreement.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">13. Governing Law</h2>
              <p className="text-muted-foreground">
                This Agreement is governed by and construed in accordance with
                the laws of the State of Delaware, without regard to its
                conflict of law provisions. Any disputes arising under this
                Agreement shall be resolved in the courts located in Delaware.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">14. Contact</h2>
              <p className="text-muted-foreground">
                For questions about this Agreement, contact us at{" "}
                <a
                  href="mailto:legal@einstellen.io"
                  className="text-primary underline"
                >
                  legal@einstellen.io
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
