import Image from 'next/image'
import { Heading } from '../../components/heading'
import { Text } from '../../components/text'
import { Button } from '../../components/button'
import { Link } from '../../components/link'

export const metadata = { title: 'Terms of Service' }

export default function TermsOfService() {
  return (
    <main id="main" className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-white">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <Image src="/images/logo.png" alt="Stansbury Swim" width={180} height={60} className="mb-6" />
        <Heading level={1} className="mb-2 text-center">
          Stansbury Swim Terms of Service
        </Heading>
        <Text className="mb-1 text-center text-sm text-zinc-500">Last modified on April 27, 2026</Text>
        <div className="mt-6 space-y-6 text-left">
          <Text>
            These Terms of Service ("Terms") govern your access to and use of{' '}
            <Link href="https://www.stansburyswim.com">stansburyswim.com</Link> (the "Site") and the swim lesson
            scheduling, registration, and payment services operated by Stansbury Swim ("us", "we", or "our"). By
            accessing or using the Site, you agree to be bound by these Terms. If you do not agree, do not use the Site.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            The Service
          </Heading>
          <Text>
            Stansbury Swim provides an online platform for parents and guardians to register swimmers, schedule and
            manage swim lessons, communicate with instructors, complete liability waivers, and pay for lessons. Use of
            the Service requires creating an account, which you may do by signing in with Google or by registering an
            email and password.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Eligibility and Accounts
          </Heading>
          <Text>
            You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account.
            By creating an account on behalf of a minor swimmer, you represent that you are the parent or legal guardian
            of that minor and that you have authority to enroll them in lessons and accept these Terms on their behalf.
            You are responsible for keeping your login credentials confidential and for all activity that occurs under
            your account.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Sign-In with Google
          </Heading>
          <Text>
            If you choose to sign in using Google, your use of the Site is also subject to{' '}
            <Link href="https://policies.google.com/terms">Google's Terms of Service</Link> and{' '}
            <Link href="https://policies.google.com/privacy">Google's Privacy Policy</Link>. When you sign in with
            Google, we receive basic profile information (such as your name, email address, and profile picture) solely
            to create and authenticate your Stansbury Swim account. We do not sell or share this information with third
            parties for advertising, and our use of information received from Google APIs adheres to the{' '}
            <Link href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </Link>
            , including the Limited Use requirements. You may revoke our access to your Google account at any time by
            visiting <Link href="https://myaccount.google.com/permissions">your Google account permissions page</Link>.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Lessons, Scheduling, and Cancellations
          </Heading>
          <Text>
            Lesson availability, instructor assignments, pool locations, session lengths, and pricing are determined by
            Stansbury Swim and may change. We reserve the right to reschedule, substitute instructors for, or cancel
            lessons due to weather, pool closures, instructor availability, insufficient enrollment, or other
            operational reasons. Make-up lessons, credits, and refund eligibility are governed by the cancellation and
            refund policies posted on the Site at the time of registration.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Payments
          </Heading>
          <Text>
            Payment for lessons is processed through third-party payment providers, including PayPal and Apple Pay. By
            submitting a payment, you authorize the applicable provider to charge the payment method you select for the
            full amount due. You are responsible for any taxes or fees imposed by your payment provider. Stansbury Swim
            does not store your full payment card or banking information; that information is handled by the payment
            provider under their own terms and privacy policies.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Waivers and Assumption of Risk
          </Heading>
          <Text>
            Swim lessons involve inherent physical risks. As part of registration, you may be required to electronically
            sign a liability waiver acknowledging those risks on behalf of yourself and any minor swimmer you are
            registering. The terms of any waiver you sign are incorporated by reference into these Terms.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Acceptable Use
          </Heading>
          <Text>
            You agree not to use the Site to: (a) violate any applicable law or regulation; (b) impersonate another
            person or misrepresent your relationship to a swimmer; (c) interfere with, disrupt, or attempt to gain
            unauthorized access to the Site or its underlying systems; (d) upload or transmit viruses, malware, or other
            harmful code; (e) scrape, harvest, or otherwise collect information about other users; or (f) use the Site
            in any manner that could damage, disable, overburden, or impair it.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            User Content
          </Heading>
          <Text>
            You are responsible for any information you submit through the Site, including swimmer profiles, contact
            information, signatures, and messages. You represent that you have the right to submit such information and
            that it is accurate. You grant Stansbury Swim a limited license to use this information for the purpose of
            providing the Service.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Intellectual Property
          </Heading>
          <Text>
            The Site, including its design, text, graphics, logos, and software, is owned by Stansbury Swim or its
            licensors and is protected by copyright, trademark, and other intellectual property laws. You may not copy,
            modify, distribute, or create derivative works from the Site without our prior written consent.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Disclaimer of Warranties
          </Heading>
          <Text>
            The Site is provided on an "as is" and "as available" basis without warranties of any kind, whether express
            or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, or
            uninterrupted or error-free operation. We do not warrant that the Site will be available at all times or
            free of bugs, viruses, or other harmful components.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Limitation of Liability
          </Heading>
          <Text>
            To the fullest extent permitted by law, Stansbury Swim and its owners, employees, instructors, and
            contractors will not be liable for any indirect, incidental, special, consequential, or punitive damages, or
            any loss of profits or revenues, whether incurred directly or indirectly, arising out of or in connection
            with your use of the Site or participation in lessons. Our total liability for any claim arising under these
            Terms will not exceed the amount you paid to us in the twelve months preceding the claim.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Indemnification
          </Heading>
          <Text>
            You agree to indemnify and hold harmless Stansbury Swim and its owners, employees, instructors, and
            contractors from any claims, damages, liabilities, and expenses (including reasonable attorneys' fees)
            arising out of your use of the Site, your violation of these Terms, or your violation of the rights of any
            third party.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Termination
          </Heading>
          <Text>
            We may suspend or terminate your access to the Site at any time, with or without notice, if we reasonably
            believe you have violated these Terms or engaged in conduct that may harm Stansbury Swim, its instructors,
            or other users. You may close your account at any time by contacting us. Provisions of these Terms that by
            their nature should survive termination will survive.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Third-Party Services
          </Heading>
          <Text>
            The Site relies on third-party services, including Google for authentication, PayPal and Apple Pay for
            payment processing, and email delivery providers. Your use of those services through the Site is subject to
            the applicable third-party terms and privacy policies, and Stansbury Swim is not responsible for their
            performance, availability, or practices.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Privacy
          </Heading>
          <Text>
            Your use of the Site is also subject to our <Link href="/privacy-policy">Privacy Policy</Link>, which
            describes how we collect, use, and disclose information about you.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Changes to These Terms
          </Heading>
          <Text>
            We may update these Terms from time to time. When we do, we will revise the "Last modified" date above and
            post the updated Terms on the Site. Your continued use of the Site after the changes take effect constitutes
            your acceptance of the revised Terms.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Governing Law
          </Heading>
          <Text>
            These Terms are governed by the laws of the State of Utah, without regard to its conflict of law principles.
            Any dispute arising out of or relating to these Terms or the Site will be resolved in the state or federal
            courts located in Utah, and you consent to the personal jurisdiction of those courts.
          </Text>

          <Heading level={2} className="mt-8 mb-2">
            Contact Us
          </Heading>
          <Text>If you have any questions about these Terms, please contact us at info@stansburyswim.com.</Text>
        </div>
        <Button href="/" color="blue" className="mt-10 w-40">
          Home
        </Button>
      </div>
    </main>
  )
}
