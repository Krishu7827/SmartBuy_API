let {redis} = require('../redis.db')
let JWT = require('jsonwebtoken')
require('dotenv').config()

let authenticate = async(req,res,next)=>{

    if(req.query.adminPassword == process.env.adminPassword){
        next()
    }else{
        res.status(500).send({msg:"only admin can access this route"})

    }
}

let UserAuthenticate = async(req,res,next)=>{

    let token = await redis.get(req.body.email)

    if(token == null){

        res.status(500).send({msg:"you didn't login yet, do login first"})

    }else{

        JWT.verify(token,process.env.privateKey,(err,result)=>{
            if(err){
                res.status(500).send({msg:err.message})
            }else{
                next()
            }
        })

    }

}

module.exports = {authenticate,UserAuthenticate}