const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER, // .env dosyasından alın
    pass: process.env.EMAIL_PASS, // .env dosyasından alın
  },
});

/**
 * E-posta gönderim fonksiyonu
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} subject - E-posta konusu
 * @param {string} htmlContent  - E-posta içeriği
 * @returns {Promise<void>} - Gönderim işlemi tamamlandığında bir söz verir
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"Smart Home System" <${process.env.EMAIL_USER}>`, // Gönderen
      to, // Alıcı
      subject, // Konu
      html: htmlContent
      // text, // İçerik
    });
    // console.log(`E-posta başarıyla gönderildi: ${to}`);
  } catch (error) {
    console.error("E-posta gönderim hatası:", error);
    throw new Error("E-posta gönderimi başarısız oldu.");
  }
};

module.exports = sendEmail;
