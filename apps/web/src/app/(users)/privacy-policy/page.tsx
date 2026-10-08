import Image from 'next/image'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { Button } from '../../components/button'
import { Link } from '../../components/link'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPolicy() {
  return (
    <main id="main" className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-white">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <Image src="/images/logo.png" alt="Stansbury Swim" width={180} height={60} className="mb-6" />
        <Heading level={1} className="mb-2 text-center">
          Stansbury Swim Privacy Policy
        </Heading>
        <Text className="mb-1 text-center text-sm text-zinc-500">Last modified on April 27, 2026</Text>
        <div className="mt-6 space-y-6 text-left">
          <Text>
            Stansbury Swim ("us", "we", or "our") operates{' '}
            <Link href="https://www.stansburyswim.com">stansburyswim.com</Link> (the "Site") and the swim lesson
            scheduling, registration, and payment service offered through it (the "Service"). This Privacy Policy
            describes the information we collect from users of the Service, how we use it, and the choices you have. By
            using the Service, you agree to the collection and use of information in accordance with this policy. Terms
            used here have the same meanings as in our <Link href="/terms-of-service">Terms of Service</Link>.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Information We Collect
          </Heading>
          <Text>
            We collect information that you provide to us directly when you create an account, register a swimmer,
            schedule a lesson, sign a waiver, or pay for lessons. This includes your name, email address, postal
            address, phone number, the names and ages of swimmers you register, swimmer skill levels and notes relevant
            to lesson planning, electronic signatures on liability waivers, and account credentials. When you make a
            payment, the payment amount and a transaction reference are recorded by us; the full payment card or bank
            account details are entered into and handled by our payment providers (PayPal and Apple Pay) and are not
            stored on our systems.
          </Text>
          <Text>
            We also automatically collect certain information when you use the Site, including your Internet Protocol
            ("IP") address, browser type and version, the pages you visit, the time and date of your visit, the time
            spent on those pages, and similar diagnostic data ("Log Data"). This information is used for security,
            debugging, and to improve the Service.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Sign-In with Google and Use of Google User Data
          </Heading>
          <Text>
            We offer the option to create an account or sign in using Google. When you choose to sign in with Google,
            Google sends us a signed identity token that we verify to confirm your identity. From that token, we read
            and store your email address, your Google account identifier, and your first and last name. The identity
            token may also contain a profile picture URL; we do not store or display it. We do not request, obtain, or
            store a Google access token, and we do not access any other Google services on your behalf — we do not read
            your Google contacts, calendar, drive files, photos, or any other Google product data.
          </Text>
          <Text>
            We use the information received from Google solely to: (a) verify your identity and authenticate you to the
            Service; (b) create your Stansbury Swim account; and (c) pre-fill your name on your Stansbury Swim profile.
            If you sign in with Google using an email address that already has a Stansbury Swim password account, we
            will not link the two automatically — you will be asked to sign in with your password first to confirm
            ownership of the account. This data is stored in our user database alongside your other account information
            for as long as your account is active.
          </Text>
          <Text>
            <strong>
              Stansbury Swim's use and transfer to any other app of information received from Google APIs will adhere to
              the{' '}
              <Link href="https://developers.google.com/terms/api-services-user-data-policy">
                Google API Services User Data Policy
              </Link>
              , including the Limited Use requirements.
            </strong>{' '}
            We do not sell or transfer Google user data to third parties for advertising, retargeting, credit-worthiness
            decisions, or any other purpose unrelated to providing the Service. We do not allow humans to read Google
            user data except (i) with your affirmative consent for specific messages, (ii) where necessary for security
            purposes such as investigating abuse, (iii) to comply with applicable law, or (iv) where the data has been
            aggregated and anonymized for internal operations. We do not use Google user data to serve advertisements,
            and we do not transfer it to data brokers, ad networks, or information resellers.
          </Text>
          <Text>
            You can revoke Stansbury Swim's access to your Google Account at any time by visiting{' '}
            <Link href="https://myaccount.google.com/permissions">your Google Account permissions page</Link>. Revoking
            access will not delete an account you have already created with us; to delete the account itself and the
            associated data, contact us using the address below.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            How We Use Your Information
          </Heading>
          <Text>
            We use the information we collect to: create and authenticate your account; register swimmers and schedule
            lessons; communicate with you about lessons, schedule changes, payments, and Service announcements; process
            payments and provide receipts; produce and retain liability waivers; respond to support requests; detect,
            investigate, and prevent abuse, fraud, or security incidents; and operate, maintain, and improve the
            Service. We do not use your information for advertising or sell it to third parties.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            How We Share Your Information
          </Heading>
          <Text>We share information only as needed to operate the Service or as described below:</Text>
          <Text>
            <strong>Instructors and staff:</strong> Information about a registered swimmer (name, age, skill notes,
            scheduled lessons, parent/guardian contact information) is made available to the Stansbury Swim instructors
            and administrators responsible for delivering and coordinating that swimmer's lessons.
          </Text>
          <Text>
            <strong>Service providers:</strong> We share information with third parties that help us operate the
            Service, including payment processors (PayPal and Apple Pay) for processing transactions, transactional
            email providers (Resend) for sending account and lesson-related emails, hosting and infrastructure providers
            (Vercel, MongoDB Atlas, Supabase, and Google Cloud), error monitoring (Sentry), and analytics (Vercel
            Analytics). These providers are permitted to use the information only to perform services for us and are
            bound by confidentiality obligations.
          </Text>
          <Text>
            <strong>Legal and safety:</strong> We may disclose information if we believe in good faith that it is
            necessary to comply with a legal obligation, enforce our Terms of Service, protect the rights, property, or
            safety of Stansbury Swim, our users, or others, or in connection with a government or law enforcement
            request.
          </Text>
          <Text>
            <strong>Business transfers:</strong> If Stansbury Swim is involved in a merger, acquisition, or sale of
            assets, your information may be transferred as part of that transaction. We will provide notice on the Site
            if such a transfer occurs and will require the recipient to honor this Privacy Policy.
          </Text>
          <Text>
            We do not sell your personal information, and we do not share Google user data with any third party for
            advertising purposes.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Data Retention and Deletion
          </Heading>
          <Text>
            We retain your account and swimmer information for as long as your account is active or as needed to provide
            the Service. After account closure, we may retain certain records (such as signed waivers, payment history,
            and transaction logs) for the period required to comply with our legal, accounting, and recordkeeping
            obligations, and we may retain limited information for fraud prevention. You can request deletion of your
            account and associated personal information by contacting us at the address below; we will honor verified
            deletion requests subject to the limited retention obligations described above.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Children's Information
          </Heading>
          <Text>
            The Service is intended for parents and legal guardians, who use it to register minor swimmers for lessons.
            We do not knowingly allow children under 13 to create their own accounts. Information we collect about minor
            swimmers (such as name, age, and skill notes) is collected only from a parent or legal guardian who has
            agreed to these practices when registering the swimmer. Parents and guardians may review, update, or request
            deletion of their child's information at any time by contacting us.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Cookies and Local Storage
          </Heading>
          <Text>
            We use cookies and browser local storage to keep you signed in, remember your preferences, and operate the
            Site. We use a session cookie containing an authentication token after you sign in. You can instruct your
            browser to refuse all cookies or to indicate when a cookie is being sent; if you do, some portions of the
            Site (including signing in) will not function.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Security
          </Heading>
          <Text>
            We use commercially reasonable administrative, technical, and physical safeguards to protect your
            information, including encryption in transit (HTTPS), hashed passwords, scoped access controls for staff,
            and reputable hosting providers. No method of transmission over the Internet or method of electronic storage
            is 100% secure, however, and we cannot guarantee absolute security. If we become aware of a security
            incident affecting your information, we will notify you and the appropriate authorities as required by law.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Your Choices and Rights
          </Heading>
          <Text>
            You can review and update the information in your Stansbury Swim account at any time through your dashboard.
            Depending on where you live, you may have additional rights under applicable privacy laws, including the
            right to access, correct, or delete your personal information, the right to object to or restrict certain
            processing, and the right to data portability. To exercise any of these rights, contact us at the address
            below; we will respond within the period required by applicable law.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Links to Other Sites
          </Heading>
          <Text>
            The Service may contain links to other sites that are not operated by us. If you click a third-party link,
            you will be directed to that third party's site. We strongly advise you to review the privacy policy of
            every site you visit. Stansbury Swim has no control over, and assumes no responsibility for, the content,
            privacy policies, or practices of any third-party sites or services.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Changes to This Privacy Policy
          </Heading>
          <Text>
            Stansbury Swim may update this Privacy Policy from time to time. We will notify you of material changes by
            posting the new Privacy Policy on the Site and updating the "Last modified" date above. You are advised to
            review this Privacy Policy periodically for changes.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Contact Us
          </Heading>
          <Text>
            If you have any questions about this Privacy Policy or our handling of your information, including any
            request to access, correct, or delete your data, please contact us at info@stansburyswim.com.
          </Text>
        </div>
        <Button href="/" color="blue" className="mt-10 w-40">
          Home
        </Button>
      </div>
    </main>
  )
}
