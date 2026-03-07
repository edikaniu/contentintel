import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = "ContentIntel <noreply@contentintel.app>";

export async function sendTeamInviteEmail(params: {
  to: string;
  inviterName: string;
  orgName: string;
  role: string;
  token: string;
}) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${params.token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `You've been invited to join ${params.orgName} on ContentIntel`,
    html: `
      <h2>You're invited!</h2>
      <p>${params.inviterName} has invited you to join <strong>${params.orgName}</strong> on ContentIntel as a${params.role === "admin" ? "n" : ""} <strong>${params.role}</strong>.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Accept Invite</a></p>
      <p style="color:#666;font-size:14px;">This invite expires in 7 days.</p>
    `,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  token: string;
}) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${params.token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Reset your ContentIntel password",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the button below to set a new password.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
      <p style="color:#666;font-size:14px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
}

export async function sendWaitlistConfirmationEmail(params: {
  to: string;
  name: string;
}) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "You're on the ContentIntel waitlist!",
    html: `
      <h2>You're on the list, ${params.name}!</h2>
      <p>Thanks for your interest in ContentIntel. We'll be in touch soon with your invite to get started.</p>
      <p style="color:#666;font-size:14px;">In the meantime, keep an eye on your inbox.</p>
    `,
  });
}

export async function sendBetaInviteEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const signupUrl = `${process.env.NEXTAUTH_URL}/signup?invite=${params.token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "You're in! Your ContentIntel beta invite",
    html: `
      <h2>Welcome to the beta, ${params.name}!</h2>
      <p>Your spot on ContentIntel is ready. Click below to create your account and start discovering content opportunities.</p>
      <p><a href="${signupUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Create Your Account</a></p>
      <p style="color:#666;font-size:14px;">This invite link is valid for 7 days.</p>
    `,
  });
}
