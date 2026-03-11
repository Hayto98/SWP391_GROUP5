const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

async function sendOtpEmail(toEmail, otp) {
  const minutes = process.env.OTP_EXPIRES_MINUTES || 5
  const mailOptions = {
    from: `"SWP391 App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Mã xác minh đăng nhập của bạn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #2d7a4f; margin-bottom: 8px;">Xác minh đăng nhập</h2>
        <p style="color: #444; font-size: 15px;">Mã OTP của bạn là:</p>
        <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #111; background: #fff; border: 2px solid #2d7a4f; border-radius: 8px; padding: 16px 24px; display: inline-block; margin: 12px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 16px;">Mã có hiệu lực trong <strong>${minutes} phút</strong>. Vui lòng không chia sẻ với bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
        <p style="color: #bbb; font-size: 12px;">Nếu bạn không thực hiện đăng nhập, hãy bỏ qua email này.</p>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}

module.exports = { sendOtpEmail }
