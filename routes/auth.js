const User = require("../models/User.js");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const sendEmail = require("../Util/email.js");


//! registerrr
router.post("/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Kullanıcıyı oluşturun, ancak henüz aktif olmasın
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isVerified: false, // Kullanıcı doğrulanmamış olarak kaydedilir
            verificationToken,
        });

        await newUser.save();

    // Ortama göre doğru URL'yi seçmek
    const apiUrl = process.env.NODE_ENV === 'production' ? process.env.BASE_URL : process.env.TEST_URL;
    // const apiUrl = process.env.API_URL;

    // const verificationUrl = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;
    const verificationUrl = `${apiUrl}/api/auth/verify/${verificationToken}`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2 style="color: #333;">Hesabınızı Doğrulayın</h2>
      <p style="font-size: 16px; color: #555;">
        Merhaba <strong>${username}</strong>,<br>
        Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
      </p>
      <a href="${verificationUrl}" 
        style="display: inline-block; padding: 12px 24px; font-size: 18px; 
        color: white; background-color: #007bff; text-decoration: none; 
        border-radius: 5px; margin-top: 10px;">
        Hesabınızı Doğrulayın
      </a>
      <p style="margin-top: 20px; font-size: 14px; color: #888;">
        Eğer bu isteği siz yapmadıysanız, bu e-postayı dikkate almayınız.
      </p>
    </div>
  `;

  await sendEmail(email, "Hesabınızı Doğrulayın", htmlContent);

    // await sendEmail(
    //   email,
    //   "E-posta Doğrulama",
    //   `Lütfen e-posta adresinizi doğrulamak için bu bağlantıya tıklayın: ${verificationUrl}`,
    // );

    res.status(200).json("Kayıt başarılı, lütfen e-posta adresinizi doğrulayın.");

    } catch (error) {
      
        if (error.code === 11000) {
          // Duplicate key error
          res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor" });
        } else {
            res.status(500).json({ message: "Bir hata oluştu" });
        }
    }
  });

router.get("/verify/:token", async (req, res) => {
    try {
      const token = req.params.token;
      

  
      // Veritabanında token'ı bul
      const user = await User.findOne({ verificationToken: token });
  
      if (!user) {
        return res.status(400).json({ message: "Geçersiz veya süresi dolmuş doğrulama bağlantısı." });
      }
  
      // Kullanıcıyı doğrulanmış olarak işaretle
      user.isVerified = true;
      user.verificationToken = null; // Token'ı sıfırlayın
      await user.save();
  
      res.status(200).json({ message: "E-posta başarıyla doğrulandı!" });
    } catch (error) {
      console.error("Hata:", error);
      res.status(500).json({ message: "Bir hata oluştu." });
    }
  });


//login
router.post("/login",async(req,res)=>{
    try {


        const user = await User.findOne({ email: req.body.email,isDeleted:false });

        if (!user) {
            return res.status(404).json({ error: "Kullanıcı bulunamadı.!" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: "E-posta adresinizi doğrulayın." });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);

        if (!validPassword) {
            return res.status(403).json("Kullanıcı adı veya şifre hatalı !");
        }

        const userModel = {
            userId: user._id,
            username: user.username,
        };

        const token = jwt.sign(userModel, `${process.env.SECRET_KEY}`);

        userModel.token = token;

        res.status(200).json(userModel);

    } catch (error) {
        console.log(error);
    }
})


//! change password
router.post("/change-password", async (req, res) => {
    try {
       
      const { email, oldPassword, newPassword } = req.body;
  
      // Kullanıcıyı e-posta adresine göre bul
      const user = await User.findOne({ email });
   
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı." });
      }
  
      // Kullanıcının eski şifresini doğrula
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Eski şifre yanlış." });
      }
  
   
      // Yeni şifreyi hash'le
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
  
      // Yeni şifreyi güncelle
      user.password = hashedNewPassword;
   
      await User.findOneAndUpdate({email:req.body.email},user);
  
      res.status(200).json({ message: "Şifre başarıyla güncellendi." });
    } catch (error) {
      res.status(400).json({ message: "Şifre güncelleme işlemi başarısız oldu.", error });
    }
  });
  

//reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Kullanıcıyı e-posta adresine göre bul
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // 6 haneli rastgele şifre oluştur
    const generateRandomPassword = () => {
      return Math.random().toString(36).slice(-6); // 6 haneli alfa-numerik bir şifre oluştur
    };
    const randomPassword = generateRandomPassword();

    // Rastgele şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    // Yeni şifreyi güncelle
    user.password = hashedPassword;
    await user.save();

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2 style="color: #333;">Yeni Şifreniz</h2>
      <p style="font-size: 16px; color: #555;">
        Merhaba <strong>${user.username}</strong>,<br>
         Yeni şifreniz: <strong>${randomPassword}</strong>. Lütfen giriş yaptıktan sonra şifrenizi değiştirin.
      </p>
      <p style="margin-top: 20px; font-size: 14px; color: #888;">
        Eğer bu isteği siz yapmadıysanız, bu e-postayı dikkate almayınız.
      </p>
    </div>
  `;

    // await sendEmail(
    //   email,
    //   "Şifre Sıfırlama Talebi",
    //   `Merhaba, yeni şifreniz: ${randomPassword}. Lütfen giriş yaptıktan sonra şifrenizi değiştirin.`
    // );
    await sendEmail(
      email,
      "Şifre Sıfırlama Talebi",
      htmlContent
    );

    res.status(200).json({
      message: "Yeni şifre başarıyla oluşturuldu ve e-posta adresinize gönderildi.",
    });
  } catch (error) {
    console.error("Hata:", error);
    res.status(400).json({
      message: "Şifre sıfırlama işlemi başarısız oldu.",
      error,
    });
  }
});


module.exports=router;