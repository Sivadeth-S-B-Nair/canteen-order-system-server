const nodemailer=require("nodemailer")

const transporter=nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port:parseInt(process.env.SMTP_PORT,10)||587,
    secure:parseInt(process.env.SMTP_PORT,10)===465,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS
    },
})

transporter.verify((err)=>{
    if(err){
        console.warn("[Email] SMTP connection failed:",err.message)
    }
    else{
        console.log("[Email] SMTP transporter ready")
    }
})

const sendMail=async(options)=>{
    try{
        const info=await transporter.sendMail({
            from:process.env.EMAIL_FROM||`"Canteen Platform" <noreply@canteen.app>`,...options,
        })
        console.log(`[Email] send to ${options.to} - MessageId: ${info.messageId}`);
        return true
    }
    catch(err){
        console.error(`[Email] Failed to send to ${options.to}:`,err.message)
        return false
    }
}

const sendRestaurantAdminCredentials=async({name,email,password,restaurantName})=>{
    const loginUrl=process.env.CLIENT_URL?`${process.env.CLIENT_URL}/login`:"http://localhost:3001/login"
    const subject=`Your Admin Account for ${restaurantName} - Canteen Platform`
    const text=`
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

    const html=`
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

    return sendMail({to:email,subject,text,html})
}

module.exports={sendRestaurantAdminCredentials}