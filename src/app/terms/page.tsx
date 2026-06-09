import PageHero from "@/components/PageHero";

export default function TermsPage() {
  return (
    <main className="page">
      <PageHero
        title="Terms of Use"
        subtitle="Rules, responsibilities, and acceptable conduct for using Pro Wrestling Picks."
      />

      <section className="card space-y-6">
        <p className="text-sm text-slate-400">
          Last Updated: June 2026
        </p>

        <div>
          <h2 className="mb-2 text-2xl font-black">Acceptance of Terms</h2>

          <p className="text-slate-300">
            By creating an account or using Pro Wrestling Picks, you agree to
            comply with these Terms of Use and all applicable laws and
            regulations.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">Account Eligibility</h2>

          <p className="text-slate-300">
            Users must be at least 13 years old to create an account and use
            the platform.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Account Responsibility
          </h2>

          <p className="text-slate-300">
            Users are responsible for all activity conducted through their
            account. You are responsible for maintaining the security of your
            login credentials and for any actions taken using your account.
          </p>

          <p className="mt-4 text-slate-300">
            Sharing accounts, allowing others to access your account, or
            failing to protect your account credentials may result in loss of
            access, league penalties, account suspension, or permanent account
            termination.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Fair Play & Cheating
          </h2>

          <p className="text-slate-300">
            Users are expected to participate honestly and fairly.
          </p>

          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
            <li>
              Creating multiple accounts to gain an unfair advantage is
              prohibited.
            </li>
            <li>
              Exploiting bugs, loopholes, vulnerabilities, or technical issues
              is prohibited.
            </li>
            <li>
              Manipulating rankings, picks, scores, league outcomes, or site
              systems is prohibited.
            </li>
            <li>Sharing accounts is prohibited.</li>
            <li>
              Attempting to circumvent bans, suspensions, or league penalties
              is prohibited.
            </li>
          </ul>

          <p className="mt-4 text-slate-300">
            Violations may result in league penalties, league removal, score
            adjustments, account suspension, or permanent account termination.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            League Enforcement
          </h2>

          <p className="text-slate-300">
            League Managers (LMs) may enforce league-specific rules and may
            remove members from their leagues. Site administrators reserve the
            right to remove users from leagues, reverse league actions, or
            suspend accounts when necessary.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Community Conduct
          </h2>

          <p className="text-slate-300">
            Users must treat others respectfully.
          </p>

          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-300">
            <li>No harassment, bullying, or intimidation.</li>
            <li>No hate speech or discrimination.</li>
            <li>No threats of violence.</li>
            <li>No impersonation of other users.</li>
            <li>No spam, scams, or fraudulent activity.</li>
            <li>
              No posting or distributing illegal, harmful, or malicious
              content.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Child Safety & Exploitation Policy
          </h2>

          <p className="text-slate-300">
            Pro Wrestling Picks maintains a zero-tolerance policy toward child
            exploitation, grooming, predatory behavior, or any inappropriate
            sexual communications involving minors.
          </p>

          <p className="mt-4 text-slate-300">
            Users may not use the platform to engage in, promote, facilitate,
            solicit, encourage, or discuss sexual activity involving minors.
          </p>

          <p className="mt-4 text-slate-300">
            Accounts found engaging in child exploitation, grooming behavior,
            predatory conduct, or related illegal activity will be permanently
            terminated without warning.
          </p>

          <p className="mt-4 text-slate-300">
            Pro Wrestling Picks reserves the right to preserve relevant records
            and cooperate with law enforcement agencies when investigating
            suspected criminal conduct.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Intellectual Property
          </h2>

          <p className="text-slate-300">
            All logos, graphics, software, designs, databases, and content on
            Pro Wrestling Picks are protected by applicable intellectual
            property laws and may not be copied, reproduced, or redistributed
            without permission.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            No Gambling
          </h2>

          <p className="text-slate-300">
            Pro Wrestling Picks is a fantasy entertainment platform and does
            not provide gambling, wagering, betting, sportsbooks, or real-money
            gaming services.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Disclaimer of Warranties
          </h2>

          <p className="text-slate-300">
            The platform is provided on an "AS IS" and "AS AVAILABLE" basis
            without warranties of any kind, express or implied.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Limitation of Liability
          </h2>

          <p className="text-slate-300">
            To the maximum extent permitted by law, Pro Wrestling Picks shall
            not be liable for indirect, incidental, consequential, special, or
            punitive damages arising from use of the platform.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Termination
          </h2>

          <p className="text-slate-300">
            We reserve the right to suspend, restrict, remove, or permanently
            terminate any account that violates these Terms of Use or threatens
            the safety, integrity, or operation of the platform.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Changes to Terms
          </h2>

          <p className="text-slate-300">
            These Terms may be updated periodically. Continued use of the
            platform after changes become effective constitutes acceptance of
            the revised Terms.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-black">
            Contact Information
          </h2>

          <p className="text-slate-300">
            Questions regarding these Terms may be submitted through the
            contact information provided on Pro-WrestlingPicks.com.
          </p>
        </div>
      </section>
    </main>
  );
}
