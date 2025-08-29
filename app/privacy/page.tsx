import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Bibliotheca Nexus",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="prose prose-neutral dark:prose-invert mt-8">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide such as name, email, phone number, optional bio, and profile image when
          purchasing co‑authorship positions. We also collect technical data like IP address and device information.
        </p>

        <h2>2. How We Use Information</h2>
        <p>
          We use your information to operate the Service, process payments, allocate co‑authorship positions, provide
          support, and comply with legal obligations.
        </p>

        <h2>3. Sharing of Information</h2>
        <p>
          We share data with service providers (e.g., payment processors). We do not sell your personal information.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          We retain information as necessary to provide the Service and meet legal requirements, then securely delete or
          anonymize it.
        </p>

        <h2>5. Your Rights</h2>
        <p>You may request access, correction, or deletion of your personal data, subject to applicable law.</p>

        <h2>6. Security</h2>
        <p>We use reasonable administrative, technical, and organizational measures to protect your information.</p>

        <h2>7. Children</h2>
        <p>The Service is not directed to children under 13 (or other age as defined by local law).</p>

        <h2>8. Changes</h2>
        <p>
          We may update this policy. Continued use of the Service after changes indicates your consent to the updated
          policy.
        </p>

        <h2>9. Contact</h2>
        <p>Privacy questions? Contact us at privacy@bibliothecanexus.example.</p>
      </section>
    </main>
  )
}
