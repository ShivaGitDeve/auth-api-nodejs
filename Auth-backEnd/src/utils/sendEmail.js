import nodemailer from "nodemailer";

// tests is transporter ka sendMail mock karte hain
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// html optional hai - purane calls (to, subject, text) waise hi chalte hain
const sendEmail = async (to, subject, text, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    ...(html && { html }),
  });
};

export default sendEmail;
