import PageHero from "@/components/PageHero";

export default function PrivacyPolicyPage() {
  return (
    <main className="page">
      <PageHero
        title="Privacy Policy"
        subtitle="How Pro Wrestling Picks collects, uses, and protects your information."
      />

      <section className="card space-y-6">
        <p className="text-sm text-slate-400">
          Last Updated: June 2026
        </p>

        <div>
          <h2 className="mb-2 text-2xl font-black">Information We Collect</h2>

          <p className="text-slate-300">
            When you create an account, we may collect information such as your
            email address, display name, profile information, league
            memberships, event picks, rankings, and account activity.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">How We Use Information</h2>

          <p className="text-slate-300">
            We use collected information to operate the platform, maintain user
            accounts, calculate rankings, manage leagues, improve site
            performance, provide support, and communicate important updates.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">League Data</h2>

          <p className="text-slate-300">
            League participation, rankings, picks, and leaderboard information
            may be visible to members of your league and, where applicable,
            users of public leagues.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Cookies & Analytics</h2>

          <p className="text-slate-300">
            We may use cookies and analytics services to improve performance,
            security, and user experience. These tools help us understand how
            visitors interact with the platform.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Email Communications</h2>

          <p className="text-slate-300">
            We may send account-related emails including verification emails,
            password reset requests, service announcements, and important
            account notifications.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Data Security</h2>

          <p className="text-slate-300">
            We take reasonable measures to protect user information. However,
            no online service can guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Third-Party Services</h2>

          <p className="text-slate-300">
            Pro Wrestling Picks may utilize third-party providers including
            hosting, authentication, email delivery, analytics, and database
            services to operate the platform.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Children's Privacy</h2>

          <p className="text-slate-300">
            The platform is not intended for children under the age of 13. We
            do not knowingly collect personal information from children under
            13 years of age.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Changes To This Policy</h2>

          <p className="text-slate-300">
            We may update this Privacy Policy periodically. Continued use of
            the platform after changes become effective constitutes acceptance
            of the revised policy.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Contact Us</h2>

          <p className="text-slate-300">
            Questions regarding this Privacy Policy may be submitted through
            Support@Pro-WrestlingPicks.com.
          </p>
        </div>
      </section>
    </main>
  );
}
