let express = require("express")
let passport = require("../Routers/Google-ouath")
let {forgotPassword,logout,login,signup} = require("../Controller/user.controller")
let {UserModel} = require('../Models/User.Model')
let JWT = require('jsonwebtoken')
const { redis } = require("../redis.db")
let UserRouter = express.Router()
require('dotenv').config()

////////////////////login////////////////////////////////////////////
UserRouter.get('/auth/google',
    passport.authenticate('google', {
        scope:
            ['email', 'profile']
    }
    ));

UserRouter.get('/auth/google/callback',

    passport.authenticate('google', { failureRedirect: '/user/auth/google/failure', session: false }),

    
      async (req,res)=>{
    
            let data = await UserModel.find({email:`${req.user.email}`})
          // console.log(await UserModel.find({email:req.user.email}))
          if(data.length>0){

            let token = JWT.sign({email:req.user.email},process.env.privateKey)
            await redis.set(req.user.email,token)

            res.send({msg:"login Success"})
          }else{
            res.status(404).send({msg:"login failed"})
          }

        }
         

        

    
);

//////////////////////////////////////////////////////////login/////////////////////////////

UserRouter.post('/signup',signup)
UserRouter.patch("/forgotPassword", forgotPassword)
UserRouter.delete("/logout",logout)
UserRouter.post('/login',login)




module.exports = { UserRouter }