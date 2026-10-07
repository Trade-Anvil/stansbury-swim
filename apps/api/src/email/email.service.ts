import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { Resend } from 'resend'
import { User } from 'user/user'
import { ConfigEnum } from '../shared/config.enum'
import { Student } from 'student/student'
import { Schedule } from 'schedule/schedule'
import { formatInTimeZone } from 'date-fns-tz'
import { ORG_TIMEZONE } from '../shared/timezone'
import { PoolService } from 'pool/pool.service'
import { InstructorService } from 'instructor/instructor.service'

const FROM_ADDRESS = 'Stansbury Swim <no-reply@stansburyswim.com>'
// Where post-payment failure alerts go so a charged-but-unseated client gets caught.
const ADMIN_ALERT_ADDRESS = 'admin@elevation.tech'
const LOGO_URL = 'https://stansburyswim.com/images/logo.png'
const SITE_URL = 'https://stansburyswim.com'
const DASHBOARD_URL = 'https://stansburyswim.com/dashboard'

// Names and other values people type in end up inside email HTML. Escaping them stops a sign-up
// from smuggling links or markup into mail that goes out under our domain.
const escapeHtml = (value: string | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

@Injectable()
export class EmailService {
  constructor(
    public readonly jwtService: JwtService,
    public readonly configService: ConfigService,
    public readonly userService: UserService,
    public readonly logger: Logger,
    public readonly poolService: PoolService,
    public readonly instructorService: InstructorService,
  ) {}

  public async sendResetPasswordLink(email: string): Promise<void> {
    const payload = { email }

    const secret = this.configService.get(ConfigEnum.JwtVerificationTokenSecret)
    const expiresIn = this.configService.get(ConfigEnum.JwtVerificationTokenExpirationTime)

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    })

    const user = await this.userService.findOneForAuth(email)

    if (!user) {
      throw new BadRequestException('User not found')
    }

    await this.userService.updateResetToken(user, token)

    const url = `${this.configService.get(ConfigEnum.EmailResetPasswordUrl)}?token=${token}`

    const html = this.renderEmailLayout(
      'Reset your password',
      `${this.renderHeading('Reset your password')}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">Hi,</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">We received a request to reset the password for your Stansbury Swim account. Click the button below to choose a new password.</p>
      ${this.renderButton(url, 'Reset password')}
      <p style="margin:24px 0 8px 0;font-size:13px;line-height:1.6;color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${url}" style="color:#428BCA;text-decoration:underline;">${url}</a></p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">If you didn't request a password reset, you can safely ignore this email &mdash; your password won't be changed.</p>`,
    )

    await this.sendMail({
      to: email,
      from: FROM_ADDRESS,
      subject: 'Reset your password',
      html,
      // The link resets the account, so a copy in the shared inbox would let anyone there take it over.
      bccOffice: false,
    })
  }

  /**
   * Sends the confirm-your-address link. `address` is where the link goes, which during a
   * profile email change is the staged address rather than the live one, so an address that
   * was mistyped simply never receives anything.
   */
  public async sendVerifyEmailLink(user: User, address: string): Promise<void> {
    const secret = this.configService.get(ConfigEnum.JwtVerificationTokenSecret)
    const expiresIn = this.configService.get(ConfigEnum.JwtVerificationTokenExpirationTime)

    const token = this.jwtService.sign({ email: address }, { secret, expiresIn })

    await this.userService.updateEmailVerificationToken(user.id, token)

    const url = `${SITE_URL}/verify-email?token=${token}`
    const isChange = address !== user.email

    const html = this.renderEmailLayout(
      'Confirm your email address',
      `${this.renderHeading('Confirm your email address')}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">Hi,</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">${
        isChange
          ? 'You asked to change the email address on your Stansbury Swim account to this one. Click below to confirm it. Until you do, we will keep sending to your old address.'
          : 'Please confirm this is the right address for your Stansbury Swim account so your lesson reminders and confirmations reach you.'
      }</p>
      ${this.renderButton(url, 'Confirm email address')}
      <p style="margin:24px 0 8px 0;font-size:13px;line-height:1.6;color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${url}" style="color:#428BCA;text-decoration:underline;">${url}</a></p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">If you weren't expecting this, you can ignore it and nothing will change.</p>`,
    )

    await this.sendMail({
      to: address,
      from: FROM_ADDRESS,
      subject: 'Confirm your email address',
      html,
      bccOffice: false,
    })
  }

  public async decodeConfirmationToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get(ConfigEnum.JwtVerificationTokenSecret),
      })

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email
      }
      throw new BadRequestException()
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired')
      }
      throw new BadRequestException('Bad confirmation token')
    }
  }

  public async sendWaitlistAllowedEmail(user: User): Promise<void> {
    const purchaseUrl = `${DASHBOARD_URL}/purchase`

    const html = this.renderEmailLayout(
      "You're off the waitlist!",
      `${this.renderHeading("You're off the waitlist!")}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">Hi ${escapeHtml(user.firstName)},</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">Good news &mdash; a spot has opened up and you're now able to purchase lessons with Stansbury Swim. Click below to head to your dashboard and complete your purchase.</p>
      ${this.renderButton(purchaseUrl, 'Purchase lessons')}
      <p style="margin:24px 0 8px 0;font-size:13px;line-height:1.6;color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="margin:0 0 24px 0;font-size:13px;line-height:1.6;word-break:break-all;"><a href="${purchaseUrl}" style="color:#428BCA;text-decoration:underline;">${purchaseUrl}</a></p>
      ${this.renderSignoff()}
      ${this.renderPoliciesList(true)}
      ${this.renderSignoff()}`,
    )

    await this.sendMail({
      to: user.email,
      from: FROM_ADDRESS,
      subject: "You're off the waitlist — purchase your lessons",
      html,
    })
  }

  public async sendWelcomeEmail(user: User): Promise<void> {
    const pStyle = 'style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;"'
    const olStyle = 'style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:15px;line-height:1.6;color:#374151;"'
    const liStyle = 'style="margin-bottom:12px;"'

    const html = this.renderEmailLayout(
      'Welcome to Stansbury Swim!',
      `${this.renderHeading('Welcome to Stansbury Swim!')}
      <p ${pStyle}>Hello,</p>
      <p ${pStyle}>Thanks for registering with Stansbury Swim! We are excited to help your children develop confidence and water safety skills.</p>
      <h2 style="margin:32px 0 12px 0;font-size:18px;line-height:1.3;color:#142e55;font-weight:600;">Getting Started</h2>
      <p ${pStyle}>To make the most out of your swimming lessons, we encourage you to follow the steps below to make your child's first splash a success.</p>
      <ol ${olStyle}>
        <li ${liStyle}><strong style="color:#142e55;">Add your students to your account:</strong> Log in, click on "dashboard" in the top right corner, then "add student".</li>
        <li ${liStyle}><strong style="color:#142e55;">Purchase Swim Credits:</strong> Click on "dashboard" and then "purchase". Credit packages can be shared with siblings, friends, or neighbors!</li>
        <li ${liStyle}><strong style="color:#142e55;">Book your lessons:</strong> In your dashboard click "schedule". Feel free to filter pools, days, or instructors. In the "available" dropdown box, select your desired student for that lesson. <strong>If you haven't already, it will prompt you to sign the waiver before you are able to schedule lessons.</strong></li>
      </ol>
      <p ${pStyle}>Check out our <a href="${SITE_URL}/faq" style="color:#428BCA;">FAQ page</a> for commonly asked questions and other tips!</p>
      ${this.renderButton(DASHBOARD_URL, 'Go to your dashboard')}
      ${this.renderPoliciesList(true)}
      ${this.renderSignoff()}`,
    )

    await this.sendMail({
      to: user.email,
      from: FROM_ADDRESS,
      subject: 'Welcome to Stansbury Swim!',
      html,
    })
  }

  public async sendCancellationEmail(user: User, student: Student, schedule: Schedule): Promise<void> {
    const formattedDateTimeMdt = formatInTimeZone(schedule.startDateTime, ORG_TIMEZONE, 'MM/dd/yyyy hh:mm a')

    const html = this.renderEmailLayout(
      'Lesson Cancellation Confirmation',
      `${this.renderHeading('Lesson Cancellation Confirmation')}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">Your lesson scheduled for <strong style="color:#142e55;">${formattedDateTimeMdt}</strong> has been cancelled and your credit has been restored to your account.</p>
      ${this.renderButton(DASHBOARD_URL, 'Reserve your next lesson')}
      ${this.renderSignoff()}
      ${this.renderPoliciesList(true)}
      ${this.renderSignoff()}`,
    )

    await this.sendMail({
      to: user.email,
      from: FROM_ADDRESS,
      subject: 'Lesson Cancellation Confirmation',
      html,
    })
  }

  public async sendReservationEmail(user: User, student: Student, schedule: Schedule): Promise<void> {
    const formattedDateTimeMdt = formatInTimeZone(schedule.startDateTime, ORG_TIMEZONE, 'MM/dd/yyyy hh:mm a')
    const pool = await this.poolService.findOne(schedule.poolId)
    const instructor = await this.instructorService.findOne(schedule.instructorId)

    const html = this.renderEmailLayout(
      'Lesson Reservation Confirmation',
      `${this.renderHeading('Splash! Your lesson is confirmed')}
      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(student.name)}'s lesson reservation is confirmed. Please arrive at least 5 minutes prior to the lesson. You may cancel this lesson online up to 24 hours before lesson time with no penalty.</p>
      ${this.renderInfoCard([
        { label: 'When', value: formattedDateTimeMdt },
        { label: 'Where', value: pool.name },
        { label: 'Instructor', value: instructor.name },
      ])}
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;">We are unable to cancel, refund, or reschedule a lesson within 24 hours of lesson time. You are welcome to send a replacement student if the scheduled student is unavailable.</p>
      ${this.renderPoliciesList(
        true,
        `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#374151;">Text or call Sarah with any questions: <a href="tel:+14356596307" style="color:#428BCA;">435-659-6307</a>.</p>`,
      )}
      ${this.renderSignoff()}`,
    )

    await this.sendMail({
      to: user.email,
      from: FROM_ADDRESS,
      subject: 'Lesson Reservation Confirmation',
      html,
    })
  }

  /** Returns whether Resend accepted the reminder, so the caller only records real sends. */
  public async sendScheduleReminderEmail(
    user: User,
    student: Student,
    schedule: Schedule,
    corrected: boolean = false,
  ): Promise<boolean> {
    const formattedDateTimeMdt = formatInTimeZone(schedule.startDateTime, ORG_TIMEZONE, 'MM/dd/yyyy hh:mm a')
    const pool = await this.poolService.findOne(schedule.poolId)
    const instructor = await this.instructorService.findOne(schedule.instructorId)

    this.logger.log(
      `Sending schedule reminder email to ${user.email} for ${student.name} on ${formattedDateTimeMdt} at ${pool.name} with ${instructor.name}`,
      {
        user: user.email,
        student: student.name,
        schedule: schedule.startDateTime.toISOString(),
        pool: pool.name,
        instructor: instructor.name,
        formattedDateTimeMdt,
        corrected,
      },
    )

    const correctedCallout = corrected
      ? `<div style="margin:0 0 24px 0;padding:12px 16px;background-color:#fff7ed;border-left:4px solid #f59e0b;border-radius:6px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#92400e;"><strong>Heads up:</strong> This is a corrected reminder for your lesson. Previous email contained the wrong time.</p>
        </div>`
      : ''

    const poolDetailsBlock = pool.details
      ? `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.6;color:#374151;">${pool.details}</p>`
      : ''

    const html = this.renderEmailLayout(
      corrected ? 'Lesson Reminder (Corrected)' : 'Lesson Reminder',
      `${this.renderHeading(corrected ? 'Lesson Reminder (Corrected)' : 'Lesson Reminder')}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">Hello ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)},</p>
      ${correctedCallout}
      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">This is a reminder that your lesson for <strong style="color:#142e55;">${escapeHtml(student.name)}</strong> is scheduled below. Please arrive at least 5 minutes prior to the lesson.</p>
      ${this.renderInfoCard([
        { label: 'When', value: formattedDateTimeMdt },
        { label: 'Where', value: pool.name },
        { label: 'Address', value: pool.address },
        { label: 'Instructor', value: instructor.name },
      ])}
      ${poolDetailsBlock}
      ${this.renderPoliciesList(false)}
      <p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#374151;">We look forward to seeing you!<br>The Stansbury Swim Team</p>`,
    )

    return this.sendMail({
      to: user.email,
      from: FROM_ADDRESS,
      subject: corrected ? 'Lesson Reminder (Corrected)' : 'Lesson Reminder',
      html,
    })
  }

  public async sendReservationFailedAdminAlert(params: {
    user: User | null
    student: Student | null
    schedule: Schedule | null
    userId: string
    studentId: string
    scheduleId: string
    transactionId: string
    reason: string
    classFull: boolean
  }): Promise<void> {
    const { user, student, schedule, reason, classFull } = params

    const when = schedule?.startDateTime
      ? formatInTimeZone(schedule.startDateTime, ORG_TIMEZONE, 'MM/dd/yyyy hh:mm a')
      : 'Unknown'
    const clientName = user ? `${user.firstName} ${user.lastName}` : params.userId
    const clientEmail = user?.email ?? 'Unknown'
    const studentName = student?.name ?? params.studentId
    const action = classFull
      ? 'The class was already FULL. This customer needs a refund or to be moved to another session.'
      : 'A spot may still be open. Review and manually assign this customer to the schedule.'

    this.logger.error(
      `Reservation failed after payment — alerting admin. transaction=${params.transactionId} ` +
        `user=${params.userId} schedule=${params.scheduleId} student=${params.studentId} reason="${reason}"`,
    )

    const html = this.renderEmailLayout(
      'Action needed: reservation failed after payment',
      `${this.renderHeading('Reservation failed after payment')}
      <div style="margin:0 0 24px 0;padding:12px 16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#991b1b;"><strong>${action}</strong></p>
      </div>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">A customer was charged but their seat was not reserved. Details below.</p>
      ${this.renderInfoCard([
        { label: 'Client', value: clientName },
        { label: 'Email', value: clientEmail },
        { label: 'Student', value: studentName },
        { label: 'Session', value: when },
        { label: 'Reason', value: reason },
        { label: 'Schedule ID', value: params.scheduleId || 'N/A' },
        { label: 'Transaction ID', value: params.transactionId },
      ])}`,
    )

    await this.sendMail({
      to: ADMIN_ALERT_ADDRESS,
      from: FROM_ADDRESS,
      subject: classFull
        ? '[Action needed] Paid but class full — refund required'
        : '[Action needed] Paid but not seated — manual assignment',
      html,
    })
  }

  /**
   * Returns true only when Resend accepted the message. Callers that must not record a send
   * they did not make (reminders) should branch on this instead of assuming success.
   */
  private async sendMail(options: {
    to: string
    from: string
    subject: string
    text?: string
    html?: string
    /** Copy the office inbox. Turn off for anything carrying a sign-in or reset link. */
    bccOffice?: boolean
  }): Promise<boolean> {
    const key = this.configService.get(ConfigEnum.ResendApiKey)
    const resend = new Resend(key)

    try {
      const { data, error } = await resend.emails.send({
        from: options.from,
        to: options.to,
        ...(options.bccOffice === false ? {} : { bcc: 'info@stansburyswim.com' }),
        subject: options.subject,
        ...(options.html ? { html: options.html } : { text: options.text ?? '' }),
      })

      if (error) {
        this.logger.error(`Failed to send email to ${options.to}`, error)
        return false
      }

      this.logger.log(`Email sent to ${options.to}`, { id: data?.id })
      return true
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}`, error?.stack)
      return false
    }
  }

  private renderEmailLayout(title: string, contentHtml: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#374151;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td align="center" style="background-color:#142e55;padding:32px 24px;">
              <img src="${LOGO_URL}" alt="Stansbury Swim" width="120" style="display:block;border:0;outline:none;text-decoration:none;background-color:#ffffff;border-radius:8px;padding:12px;">
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;" align="center">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">&copy; Stansbury Swim &middot; <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline;">stansburyswim.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  private renderHeading(text: string): string {
    return `<h1 style="margin:0 0 20px 0;font-size:22px;line-height:1.3;color:#142e55;font-weight:600;">${text}</h1>`
  }

  private renderButton(href: string, label: string): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:#428BCA;">
          <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
        </td>
      </tr>
    </table>`
  }

  private renderInfoCard(rows: { label: string; value: string }[]): string {
    const rowsHtml = rows
      .map(
        r => `<tr>
          <td style="padding:6px 16px 6px 0;font-size:14px;color:#6b7280;vertical-align:top;white-space:nowrap;">${r.label}</td>
          <td style="padding:6px 0;font-size:14px;color:#142e55;font-weight:600;">${escapeHtml(r.value)}</td>
        </tr>`,
      )
      .join('')
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px 0;background-color:#f4f6f9;border-radius:8px;border-left:4px solid #428BCA;">
      <tr>
        <td style="padding:16px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${rowsHtml}
          </table>
        </td>
      </tr>
    </table>`
  }

  private renderSignoff(): string {
    return `<p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#374151;">See you soon!<br>The Stansbury Swim Team</p>`
  }

  private renderPoliciesList(includePoolAddresses: boolean, extraAfterPools?: string): string {
    const h2 = 'style="margin:32px 0 12px 0;font-size:18px;line-height:1.3;color:#142e55;font-weight:600;"'
    const p = 'style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#374151;"'
    const li = 'style="margin-bottom:8px;"'

    const ourPools = includePoolAddresses
      ? `<h2 ${h2}>Our Pools</h2>
        <p ${p}>Lessons take place at residential pools. Please be respectful of the pool owners' properties and respect their privacy. Address and other details for each pool are listed below.</p>
        <p ${p}><strong style="color:#142e55;">103 Lakeview Drive, Stansbury Park</strong> and <strong style="color:#142e55;">101 Lakeview Drive, Stansbury Park:</strong> Park perpendicular to the curb to allow for more client parking. Consider parking outside the circle and walk in. Enter through the gates on the right side of either house.</p>
        <p ${p}><strong style="color:#142e55;">5446 Lanyard Lane, Stansbury Park:</strong> Please park perpendicular to the sidewalk in the circle. If circle is full, park parallel to the sidewalk on the street. DO NOT block driveways. Enter through the gate to the right of the garage.</p>
        <p ${p}><strong style="color:#142e55;">180 E Durfee St, Grantsville:</strong> Park perpendicular to sidewalk in front of house or lots on either side of the house. Do not block mailbox. Walk down driveway and enter between the garage and large shop.</p>`
      : ''

    return `${ourPools}
    ${extraAfterPools ?? ''}
    <h2 ${h2}>Policies and Tips</h2>
    <p ${p}>To show respect to all our pool owners and other clients, please follow these requests:</p>
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
      <li ${li}>Do not block driveways, mailboxes, or garbage cans.</li>
      <li ${li}>NO PETS.</li>
      <li ${li}>Children not in a lesson are NOT allowed in the pools while they wait.</li>
      <li ${li}>Swim diapers are required for children not fully potty-trained. We strongly prefer reusable swim diapers over disposable, and sunscreen lotion over aerosol.</li>
      <li ${li}>No changing your kids into swimsuits on deck.</li>
      <li ${li}>Lessons start and end promptly. Please arrive at least 5 minutes early to be ready for the lesson.</li>
      <li ${li}>24-hour cancellation notice is required. There is no charge to reschedule any lesson if done more than 24 hours ahead of time. Within 24 hours of lesson time, there will be a full charge on all lessons. You are welcome to send a replacement student if the scheduled student is unavailable.</li>
      <li ${li}>All lesson credits MUST be used in the season purchased. Unused lesson credits will be forfeited with no refund. Seasons typically end July 31.</li>
      <li ${li}>Instructors are subject to change without notice.</li>
      <li ${li}>Recommended: Ages 3–5: 20–40 lessons. Ages 5–10: 20 lessons + Maintenance Program 1–3 times/week.</li>
    </ul>
    <h2 ${h2}>Stay Connected With Us!</h2>
    <p ${p}>To get all our updates and stay informed about weather cancellations, follow us on Facebook at <a href="https://www.facebook.com/stansburyswim" style="color:#428BCA;">facebook.com/stansburyswim</a>.</p>
    <p ${p}>Or join our Remind group: text <strong style="color:#142e55;">"@stansswim1"</strong> to <strong style="color:#142e55;">81010</strong>, or visit <a href="https://remind.com/join/stansswim1" style="color:#428BCA;">remind.com/join/stansswim1</a> to receive text updates (including new schedule offerings and cancellations due to weather).</p>`
  }
}
