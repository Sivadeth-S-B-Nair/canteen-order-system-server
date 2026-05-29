const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: parseInt(process.env.SMTP_PORT, 10) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.warn("[Email] SMTP connection failed:", err.message);
  } else {
    console.log("[Email] SMTP transporter ready");
  }
});

const sendMail = async (options) => {
  try {
    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || `"Canteen Platform" <noreply@canteen.app>`,
      ...options,
    });
    console.log(`[Email] send to ${options.to} - MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send to ${options.to}:`, err.message);
    return false;
  }
};

const sendRestaurantAdminCredentials = async ({
  name,
  email,
  password,
  restaurantName,
}) => {
  const loginUrl = process.env.CLIENT_URL
    ? `${process.env.CLIENT_URL}/login`
    : "http://localhost:3001/login";
  const subject = `Your Admin Account for ${restaurantName} - Canteen Platform`;
  const text = `
Hi ${name},

Your restaurant admin account has been created on the Canteen Platform.
 
Restaurant : ${restaurantName}
Email      : ${email}
Password   : ${password}
    
Login here: ${loginUrl}
 
IMPORTANT: Please change your password immediately after your first login.
 
If you did not expect this email, please contact your platform administrator.
 
— The Canteen Platform Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #18181b;
    }
    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .header {
      background: #2563eb;
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .header p {
      margin: 6px 0 0;
      color: #bfdbfe;
      font-size: 14px;
    }
    .body {
      padding: 36px 40px;
    }
    .body p {
      margin: 0 0 16px;
      font-size: 15px;
      line-height: 1.6;
      color: #3f3f46;
    }
    .credentials-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px 24px;
      margin: 24px 0;
    }
    .credentials-box table {
      width: 100%;
      border-collapse: collapse;
    }
    .credentials-box td {
      padding: 6px 0;
      font-size: 14px;
    }
    .credentials-box td:first-child {
      color: #71717a;
      font-weight: 500;
      width: 110px;
    }
    .credentials-box td:last-child {
      color: #18181b;
      font-weight: 600;
      font-family: 'Courier New', Courier, monospace;
      word-break: break-all;
    }
    .cta {
      display: block;
      width: fit-content;
      margin: 28px auto 0;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
    }
    .warning {
      margin-top: 28px;
      padding: 14px 18px;
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      font-size: 13px;
      color: #78350f;
      line-height: 1.5;
    }
    .footer {
      padding: 20px 40px;
      border-top: 1px solid #f4f4f5;
      text-align: center;
      font-size: 12px;
      color: #a1a1aa;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🍽️ Canteen Platform</h1>
      <p>Restaurant Admin Account Created</p>
    </div>
 
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>
        A restaurant admin account has been set up for you on the Canteen Platform.
        You can now manage the menu, staff, and orders for <strong>${restaurantName}</strong>.
      </p>
 
      <div class="credentials-box">
        <table>
          <tr>
            <td>Restaurant</td>
            <td>${restaurantName}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>${email}</td>
          </tr>
          <tr>
            <td>Password</td>
            <td>${password}</td>
          </tr>
        </table>
      </div>
 
      <a href="${loginUrl}" class="cta">Log in to your account →</a>
 
      <div class="warning">
        <strong>Change your password immediately</strong> after your first login.
        This email contains sensitive credentials — delete it once you've logged in.
      </div>
    </div>
 
    <div class="footer">
      You received this because a super admin provisioned this account.<br/>
      If this was unexpected, contact your platform administrator.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendMail({ to: email, subject, text, html });
};
const sendOrderReadyEmail = async ({ email, name, orderId }) => {
  const subject = `Your order #${orderId} is Ready for Pickup!`;
  const text = `Hi ${name || "there"},\n\nGood news! Your order #${orderId} is fresh, hot, and ready for pickup.\n\nPlease head to the counter.\n\n— The Canteen Platform Team`;

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">🍽️ Order Ready!</h2>
        <p>Hi <strong>${name || "there"}</strong>,</p>
        <p>Good news! Your order <strong>#${orderId}</strong> is ready for pickup.</p>
        <p>Please head to the counter to grab your food.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #a1a1aa;">— The Canteen Platform Team</p>
    </div>`;

  return sendMail({ to: email, subject, text, html });
};

// sendOrderCancellationEmail
//
// Sent to the user immediately when they cancel an order.
// If refundAmount is non-null, the email tells them a refund request was opened.
// If null (PAYMENT_PENDING cancellation), we just confirm the cancellation.
// ─────────────────────────────────────────────────────────────────────────────
const sendOrderCancellationEmail = async ({
  email,
  name,
  orderId,
  refundAmount,
}) => {
  const subject = `Order #${orderId} cancelled`;

  const refundLine =
    refundAmount !== null
      ? `A refund request for <strong>₹${refundAmount.toFixed(2)}</strong> has been submitted and is pending review by the restaurant. You will receive another email once it's processed.`
      : `Since payment was not completed, no refund is required.`;

  const text =
    refundAmount !== null
      ? `Hi ${name || "there"},\n\nYour order #${orderId} has been cancelled.\n\nA refund request for ₹${refundAmount.toFixed(2)} has been submitted and is pending review. You will hear back once the restaurant processes it.\n\n— The Canteen Platform Team`
      : `Hi ${name || "there"},\n\nYour order #${orderId} has been cancelled. No payment was collected.\n\n— The Canteen Platform Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><style>
body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b}
.wrapper{max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.header{background:#ef4444;padding:28px 40px;text-align:center}
.header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
.header p{margin:4px 0 0;color:#fecaca;font-size:14px}
.body{padding:32px 40px}
.body p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;font-size:14px;color:#3f3f46;line-height:1.7}
.footer{padding:16px 40px;border-top:1px solid #f4f4f5;text-align:center;font-size:12px;color:#a1a1aa}
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Order Cancelled</h1>
    <p>Order #${orderId}</p>
  </div>
  <div class="body">
    <p>Hi <strong>${name || "there"}</strong>,</p>
    <p>Your order <strong>#${orderId}</strong> has been successfully cancelled.</p>
    <div class="info-box">${refundLine}</div>
    <p>If you have questions, please contact the restaurant directly.</p>
  </div>
  <div class="footer">— The Canteen Platform Team</div>
</div>
</body>
</html>`.trim();

  return sendMail({ to: email, subject, text, html });
};

// sendRefundStatusEmail
//
// Sent when an admin approves or rejects a refund request.
// ─────────────────────────────────────────────────────────────────────────────
const sendRefundStatusEmail = async ({
  email,
  name,
  orderId,
  refundAmount,
  decision, // 'APPROVED' | 'REJECTED'
  adminNotes, // only present when REJECTED
  razorpayRefundId, // only present when APPROVED and Razorpay succeeded
}) => {
  const isApproved = decision === "APPROVED";

  const subject = isApproved
    ? `Refund approved for Order #${orderId}`
    : `Refund request update for Order #${orderId}`;

  const razorpayNote = razorpayRefundId
    ? `Your refund (ID: <code>${razorpayRefundId}</code>) has been initiated and should appear in your account within 5–7 business days.`
    : isApproved
      ? `Your refund of <strong>₹${refundAmount.toFixed(2)}</strong> has been approved and will be processed by the restaurant team.`
      : "";

  const bodyHtml = isApproved
    ? `<p>Good news! Your refund request for order <strong>#${orderId}</strong> has been <strong style="color:#16a34a">approved</strong>.</p>
       <div class="info-box"><strong>Refund amount:</strong> ₹${refundAmount.toFixed(2)}<br/>${razorpayNote}</div>`
    : `<p>We're sorry to inform you that your refund request for order <strong>#${orderId}</strong> has been <strong style="color:#dc2626">rejected</strong>.</p>
       ${adminNotes ? `<div class="info-box"><strong>Reason:</strong> ${adminNotes}</div>` : ""}
       <p>If you believe this is an error, please contact the restaurant directly.</p>`;

  const text = isApproved
    ? `Hi ${name || "there"},\n\nYour refund of ₹${refundAmount.toFixed(2)} for order #${orderId} has been approved. It should reach you in 5-7 business days.\n\n— The Canteen Platform Team`
    : `Hi ${name || "there"},\n\nYour refund request for order #${orderId} has been rejected.\n\nReason: ${adminNotes || "No reason provided."}\n\n— The Canteen Platform Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><style>
body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b}
.wrapper{max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
.header{background:${isApproved ? "#16a34a" : "#dc2626"};padding:28px 40px;text-align:center}
.header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
.header p{margin:4px 0 0;color:${isApproved ? "#bbf7d0" : "#fecaca"};font-size:14px}
.body{padding:32px 40px}
.body p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;font-size:14px;color:#3f3f46;line-height:1.7}
.footer{padding:16px 40px;border-top:1px solid #f4f4f5;text-align:center;font-size:12px;color:#a1a1aa}
code{font-family:monospace;font-size:13px;background:#f1f5f9;padding:2px 6px;border-radius:4px}
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>${isApproved ? "Refund Approved ✓" : "Refund Request Update"}</h1>
    <p>Order #${orderId}</p>
  </div>
  <div class="body">
    <p>Hi <strong>${name || "there"}</strong>,</p>
    ${bodyHtml}
  </div>
  <div class="footer">— The Canteen Platform Team</div>
</div>
</body>
</html>`.trim();

  return sendMail({ to: email, subject, text, html });
};

//sendPasswordResetEmail

const sendPasswordResetEmail = async ({ email, name, resetToken }) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const subject = "Reset your Canteen password";

  const text = `
Hi ${name || "there"},
 
You requested a password reset for your Canteen account.
 
Click the link below to choose a new password:
${resetUrl}
 
This link expires in 1 hour.
 
If you didn't request this, you can safely ignore this email.
Your password will not change until you click the link above and create a new one.
 
— The Canteen Platform Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #18181b;
    }
    .wrapper {
      max-width: 520px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .header {
      background: #2563eb;
      padding: 28px 40px;
      text-align: center;
    }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 700; }
    .header p  { margin: 6px 0 0; color: #bfdbfe; font-size: 14px; }
    .body { padding: 32px 40px; }
    .body p {
      margin: 0 0 16px;
      font-size: 15px;
      line-height: 1.6;
      color: #3f3f46;
    }
    .cta-wrapper { text-align: center; margin: 28px 0; }
    .cta {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
    }
    .url-fallback {
      margin-top: 20px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      color: #71717a;
      word-break: break-all;
    }
    .expiry-note {
      padding: 12px 16px;
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
      font-size: 13px;
      color: #78350f;
      margin: 16px 0;
    }
    .footer {
      padding: 16px 40px;
      border-top: 1px solid #f4f4f5;
      text-align: center;
      font-size: 12px;
      color: #a1a1aa;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🍽️ Canteen Platform</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="body">
      <p>Hi <strong>${name || "there"}</strong>,</p>
      <p>
        We received a request to reset the password for your Canteen account
        (<strong>${email}</strong>).
      </p>
      <div class="cta-wrapper">
        <a href="${resetUrl}" class="cta">Reset my password →</a>
      </div>
      <div class="expiry-note">
        ⏰ This link expires in <strong>1 hour</strong>. After that, you'll
        need to request a new one.
      </div>
      <p>
        If the button above doesn't work, copy and paste this URL into your
        browser:
      </p>
      <div class="url-fallback">${resetUrl}</div>
      <p style="margin-top:20px; font-size:13px; color:#71717a;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password won't change unless you click the link above.
      </p>
    </div>
    <div class="footer">
      You received this because a password reset was requested for this account.<br/>
      If this was unexpected, contact your platform administrator.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendMail({ to: email, subject, text, html });
};

/**
 * sendPasswordChangedEmail
 *
 * Security notification sent AFTER a successful password change.
 * This is critical: if someone's account was compromised and the attacker
 * changed the password, this email alerts the real owner immediately.
 *
 * Sent for BOTH flows:
 *   - Password reset via email link
 *   - Change password inside profile settings (logged-in user)
 */
const sendPasswordChangedEmail = async ({ email, name }) => {
  const subject = "Your Canteen password was changed";

  const text = `
Hi ${name || "there"},
 
This is a confirmation that the password for your Canteen account (${email}) was recently changed.
 
If you made this change, no action is needed.
 
If you did NOT make this change, please contact your platform administrator immediately and reset your password using the "Forgot Password" link on the login page.
 
— The Canteen Platform Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b}
    .wrapper{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}
    .header{background:#16a34a;padding:28px 40px;text-align:center}
    .header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
    .header p{margin:4px 0 0;color:#bbf7d0;font-size:14px}
    .body{padding:32px 40px}
    .body p{margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46}
    .warning{padding:14px 18px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;font-size:13px;color:#991b1b;line-height:1.5;margin:20px 0}
    .footer{padding:16px 40px;border-top:1px solid #f4f4f5;text-align:center;font-size:12px;color:#a1a1aa}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔒 Password Changed</h1>
      <p>Security notification</p>
    </div>
    <div class="body">
      <p>Hi <strong>${name || "there"}</strong>,</p>
      <p>
        This is a confirmation that the password for your Canteen account
        (<strong>${email}</strong>) was successfully changed.
      </p>
      <p>
        If you made this change, no action is needed — you're all set.
      </p>
      <div class="warning">
        <strong>Didn't make this change?</strong><br/>
        If you did not change your password, your account may have been
        accessed without your permission. Please use the
        <strong>Forgot Password</strong> link on the login page to secure
        your account immediately.
      </div>
    </div>
    <div class="footer">— The Canteen Platform Team</div>
  </div>
</body>
</html>
  `.trim();

  return sendMail({ to: email, subject, text, html });
};

module.exports = {
  sendRestaurantAdminCredentials,
  sendOrderReadyEmail,
  sendOrderCancellationEmail,
  sendRefundStatusEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
