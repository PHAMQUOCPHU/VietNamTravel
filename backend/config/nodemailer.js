import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SENDER_EMAIL, // Email của bạn (đặt trong file .env)
        pass: process.env.SENDER_PASSWORD, // Mật khẩu ứng dụng Gmail (đặt trong file .env)
    },
});

export default transporter;