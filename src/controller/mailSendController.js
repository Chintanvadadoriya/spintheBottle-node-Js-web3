const { MAILGUN_SENDER_EMAIL, MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, TO } = require("../constant");
const { catchAsyncError } = require("../utils")
const nodemailer = require("nodemailer");


exports.mailSend=catchAsyncError(async(req,res,next)=>{
    try{
        const userEmail = req.query.email
        const transporter = nodemailer.createTransport({
            host: MAIL_HOST,
            port: MAIL_PORT,
            secure: false,
            auth: {
                user:MAIL_USER,
                pass:MAIL_PASS,
            },
        });
    
        let info = await transporter.sendMail({
            from:MAIL_USER,
            // to: 'logisticworkit@gmail.com',
            to: TO,
            subject: 'New Email Submission',
            text: `You have received a new email submission: ${userEmail}`
        });

        res.status(200).json({
            messageId:info?.messageId,
            data:info?.envelope,
            to:info?.accepted[0],
            senderby:userEmail||''
        })

    }catch(error){
      console.log('send Mail', error)
      res.status(500).json({"error":error})
    }
  })
