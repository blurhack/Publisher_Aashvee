import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Bibliotheca Nexus",
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Terms & Conditions</h1>
      <p className="mt-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="prose prose-neutral dark:prose-invert mt-8">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Bibliotheca Nexus (the “Service”), you agree to be bound by these Terms & Conditions. If
          you do not agree, do not use the Service.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities
          under your account. You must provide accurate information and promptly update it as necessary.
        </p>

        <h2>3. Upcoming Books & Co‑Authorship Positions</h2>
        <p>
          We may list upcoming books with a limited number of co‑authorship positions for purchase. Availability,
          pricing, and requirements may change at any time at our discretion.
        </p>

        <h2>4. Payments</h2>
        <p>
          Payments are processed by third‑party providers (e.g., PhonePe). You agree to their terms and acknowledge we
          are not responsible for third‑party services.
        </p>

        <h2>5. Refunds</h2>
        <p>
          Unless required by law, purchases are non‑refundable once a position is secured. Please review all details
          before completing a purchase.
        </p>

        <h2>6. Content & Conduct</h2>
        <p>
          You must ensure that your submitted bio and media are lawful, non‑infringing, and compliant with our policies.
          We may remove content that violates these terms.
        </p>

        <h2>7. Intellectual Property</h2>
        <p>
          All trademarks, logos, and content are the property of their respective owners. You receive no license except
          as explicitly granted.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          The Service is provided “as is” without warranties. To the maximum extent permitted by law, we are not liable
          for indirect or consequential damages.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of
          the updated Terms.
        </p>

        <h2>10. Contact</h2>
        <p>Questions? Contact us at support@bibliothecanexus.example.</p>
      </section>
    </main>
  )
}
