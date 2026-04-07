import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_HOST, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  private static async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_HOST,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Unable to send email");
    }
  }

  static async sendVerificationEmail(email: string, verifyLink: string) {
    const html = `
      <h2>Email Verification</h2>
      <p>Click the button below to verify your account:</p>
      <a href="${verifyLink}" 
         style="padding:10px 20px;background:#4CAF50;color:white;text-decoration:none;">
         Verify Email
      </a>
      <p>This link expires in 1 hour.</p>
    `;
    await this.sendEmail(email, "Verify your email", html);
  }

  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOtp(email: string, otp: string) {
    const html = `
      <h2>OTP Verification</h2>
      <p>Your OTP code is:</p>
      <h1>${otp}</h1>
      <p>This code will expire in 1 minute.</p>
    `;
    await this.sendEmail(email, "Your OTP Code", html);
  }
}