 let {UserModel} = require('../Models/User.Model')
 let {redis} = require('../redis.db')
 let fs = require('fs')
 let bcrypt = require('bcrypt')
 let JWT = require('jsonwebtoken')
 let nodemailer = require('nodemailer')
 
 
require('dotenv').config()
let otp = {}
let verfiedEmail
let verifiedpassword
let verfiedName

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bluearpon4567@gmail.com',
        pass: process.env.password,
    },
    tls: {
        rejectUnauthorized: false,
    }
});

function generateOtp() {

    let OTP = Math.floor(Math.random() * (1000 - 1 + 1) + 7000)

    let onetime = OTP

    otp.OneTimePassword = onetime

    return OTP
}

let forgotPassword = async (req, res) => {


if(req.body.OTP == undefined){
    let { email, password } = req.body

    let data = await UserModel.find({ email: email })

    if (data.length !== 0) {

        verfiedEmail = email
       verifiedpassword = password
          


        let mailOptions = {
            from: "bluearpon4567@gmail.com",
            to: email,
            subject: "One Time Verification(OTP)",
            html:`
            <body style="font-family: Arial, sans-serif; font-size: 20px; color: #000000; background-color: #ffffff;">
              <div>
                <p>Dear Customer,</p>
                <p>I hope this email finds you well. As per your request, please find below your one-time password (OTP) to verify your identity and ensure the security of your account:</p>
                <p><strong style="color: #ff0000; font-weight: 300;">${generateOtp()}</strong></p>
                <p>Please note that this OTP is valid for a limited time only, so we advise that you use it as soon as possible. If you have any questions or concerns regarding this OTP, please do not hesitate to contact us.</p>
                <p>Thank you for your trust in our services and for helping us maintain the security of your account.</p>
                <p>Best regards,</p>
                <p>The Verification Team</p>
              </div>
            </body>
          `,



        }

        transporter.sendMail(mailOptions, async (err, success) => {

            if (err) {

                res.status(500).send({ "message": "Email is wrong" })

            } else {

                console.log(otp.OneTimePassword)

                res.send({ "OTP": otp.OneTimePassword })

            }
        })



    } else {

        res.status(404).send({ msg: "user is not registered in our website" })

    }
}else{

    if(req.body.OTP == otp.OneTimePassword && verifiedpassword){

 bcrypt.hash(verifiedpassword,8,async(err,hash)=>{

            if(hash){

            await UserModel.updateOne({email:verfiedEmail},{$set:{password:hash}})
            res.send({msg:"Updated Success"})

            }else if(err){

                res.status(500).send({msg:"Something wrong during hash password"})
            }
        })
    }else{
        res.status(500).send({msg:"OTP is wrong"})
    }

}

}


let logout = async (req, res) => {

    let { email } = req.body
    let accessToken = await redis.get(email)
    //console.log(accessToken)
    if (accessToken == null) {

        res.status(404).send({ msg: "accesstoken is not getting, and also you should've to send email to the backend" })
    } else {

        await redis.del(email, (err, result) => {

            if (err) {

                res.status(505).send({ msg: "something wrong to deleting of accesstoken in redis" })

            } else {

                res.send({ msg: "logout Success" })

            }
        })
    }


}


let login = async (req, res) => {

    let { email, password } = req.body

    let data = await UserModel.find({ email: email })
 
          if(data.length==0) return res.status(404).send({msg:"You didn't did signup"})

   let compare = await bcrypt.compare(password,data[0].password)
 

        if (!compare) {

            res.status(500).send({ msg: "wrong password" })

        } else {

            JWT.sign({ email: email }, process.env.privateKey, {expiresIn:"4h"}, async (err, token) => {

                if (err) {

                    res.status(500).send({ msg: "something is wrong to generating of accesstoken" })

                } else {

                    await redis.set(email, token,)

                    res.send({ msg: "login Success" })

                }
            })


        }



}

let signup = async (req,res)=>{

    if(req.body.OTP == undefined){

    let {name,email,password,role} = req.body

    let data = await UserModel.find({email:email})
    
//console.log(data)
if(data.length>0)  return res.status(505).send({msg:"you are already registered on this webiste"})

    bcrypt.hash(password,8, async(err,hash)=>{
        
       if(err){
        res.status(500).send({msg:"something wrong to genrating of hash password"})
       }else{

        verfiedName = name
        verfiedEmail = email
        verifiedpassword = hash

        let mailOptions = {
            from: "bluearpon4567@gmail.com",
            to: email,
            subject: "One Time Verification(OTP)",
            html: `<body>
            <div style="font-family: Arial, sans-serif; font-size: 20px; color: #000000; background-img:url('https://www.flaticon.com/free-icon/enrollment_2247728');">
              <p>Dear,Customer</p>
              <p> I hope this email finds you well. As per your request, please find below your one-time password (OTP) to verify your identity and ensure the security of your account:</p>
              <p> <strong style="color: #ff0000; font-weight:300">${generateOtp()}</strong></p>
              <p>Please note that this OTP is valid for a limited time only, so we advise that you use it as soon as possible. If you have any questions or concerns regarding this OTP, please do not hesitate to contact us.</p>
              <p>Thank you for your trust in our services and for helping us maintain the security of your account.</p>
              <p>Best regards,</p>
              <p>The Verification Team</p>
            </div>
          </body>`



        }

        transporter.sendMail(mailOptions, async (err, success) => {

            if (err) {

                res.status(500).send({ "message": "Email is wrong" })

            } else if(success) {

                console.log(otp.OneTimePassword)

                res.send({ "OTP": otp.OneTimePassword })

            }
        })

       }
    })
}else{

    
let data = await UserModel.find({email:verfiedEmail})
    if(req.body.OTP == otp.OneTimePassword && verfiedEmail && data.length==0){

        await  UserModel.insertMany([{name:verfiedName,email:verfiedEmail,password:verifiedpassword}])

        res.send({msg:"Signup Success"})

    }else{
        res.status(404).send({msg:"otp is wrong"})
    }
}
}

module.exports = { forgotPassword, logout, login,signup }