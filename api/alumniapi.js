const exp = require('express')
const alumniApp = exp.Router()
const expresAsyncHandler = require('express-async-handler')
const bcryptjs = require('bcryptjs')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const verifyToken = require('../Middlewares/verifyToken')
let alumnicollection;
let studentscollection;
let discollection;
let eventcollection;
alumniApp.use((req,res,next)=>{
    alumnicollection=req.app.get('alumnicollection')
    studentscollection = req.app.get('studentscollection')
    discollection = req.app.get('discollection')
    eventcollection =req.app.get('eventcollection')
    next()
})
alumniApp.post('/alumni',expresAsyncHandler(async (req,res)=>{
    const newAlumni = req.body;
    const dbAlumni = await alumnicollection.findOne({username:newAlumni.username})
  
    if(dbAlumni!=null){
        res.send({message:"Alumni user already exists"});
    }else{
        const hashedPassword = await bcryptjs.hash(newAlumni.password,6)
        newAlumni.password = hashedPassword
        await alumnicollection.insertOne(newAlumni);
        res.send({message:"Alumni Registered",payload:newAlumni})
    }
}))
alumniApp.post('/login',expresAsyncHandler(async(req,res)=>{
    const alumniCred=req.body;
   
   const dbAlumni= await alumnicollection.findOne({username:alumniCred.username})
   if(dbAlumni===null){
       res.send({message:"Invalid username"})
   }else{
       
      const status= await bcryptjs.compare(alumniCred.password,dbAlumni.password)
      if(status===false){
       res.send({message:"Invalid password"})
      }else{
   
       const signedToken=jwt.sign({username:dbAlumni.username},process.env.SECRET_KEY,{expiresIn:'1d'})
   
       res.send({message:"login success",token:signedToken,user:dbAlumni})
      }
   }
}))

alumniApp.post('/new-discussion',expresAsyncHandler(async(req,res)=>{
    const newDis = req.body;
    await discollection.insertOne(newDis)
    res.send({message:"new discussion created"});
}))
// get discussions by current user
alumniApp.get('/discussions/:username',expresAsyncHandler(async (req,res)=>{
    const name = req.params.username 
    const mydis = await discollection.find({status:true,username:name}).toArray()
    res.send({message:"your discussions",payload:mydis})

}))
// get all discussions
alumniApp.get('/discussions',expresAsyncHandler(async(req,res)=>{
    const alldis = await discollection.find({status:true}).toArray()
    res.send({message:"all discussions",payload:alldis})
}))
// comment
alumniApp.post('/comment/:did',expresAsyncHandler(async(req,res)=>{
    let did = Number(req.params.did)
    let data = req.body
    console.log(typeof did)
    // insert comment into comments array of the dis
    let found = await discollection.findOne({disId:{$eq:did}})
    console.log(found)
    const dbRes = await discollection.updateOne({disId:did},{$addToSet:{threads:data}})
    console.log(dbRes)
    if(dbRes!=null && dbRes.acknowledged===true)
        res.send({message:"Comment Posted",payload:dbRes})
    else
        res.send({message:"Failed to post Comment"})
}))
// reply to comment
alumniApp.post('/comment-reply/:id/reply/:cid',expresAsyncHandler(async(req,res)=>{
    let cid = Number(req.params.cid)
    let id = Number(req.params.id)
    let data = req.body 
    const reso = await discollection.findOne({disId:id})
    const threads = reso.threads
    const index = threads.findIndex((t)=>t.threadId==cid)
    const replies = threads[index].replies
    threads[index].replies=[...replies,data]
    const dbRes = await discollection.updateOne({disId:id},{$set:{threads:threads}})
    if(dbRes){
        res.send({message:"reply posted"})
    }
}))
//post events
alumniApp.post('/eventa',expresAsyncHandler(async(req,res)=>{
    //get new event from alumni
    const newevent=req.body;
    console.log(newevent)
    //post to events collection
    await eventcollection.insertOne(newevent)
    //send res
    res.send({message:"New event created"})
}))


// soft delete
alumniApp.put('/eventa/:eventId',expresAsyncHandler(async(req,res)=>{
    // get articleId from url
    const articleIdFromUrl=req.params.eventId;
    // get article
    const articleToDelete=req.body
    //update status of article to false
    await eventcollection.updateOne({eventId:articleIdFromUrl},{$set:{...articleToDelete,status:false}})
    //send res
    res.send({message:"Event Ended"})

}))
alumniApp.get('/eventa/:eventId',expresAsyncHandler(async(req,res)=>{
    const eid = req.params.eventId
    const articles = await eventcollection.find({eventId:eid}).toArray()
    res.send({message:"your events",payload:articles})
}))
alumniApp.get('/eventa/user-event/:username',expresAsyncHandler(async(req,res)=>{
    const name = req.params.username
    const articles = await eventcollection.find({username:name}).toArray()
    res.send({message:"your events",payload:articles})
}))
alumniApp.post('/event/comment/:eventId',expresAsyncHandler(async (req,res)=>{
    id = Number(req.params.eventId)
    let data = req.body
    // insert comment into comments array of the article
    const dbRes = await eventcollection.updateOne({eventId:id},{$addToSet:{comments:data}})
    if(dbRes.acknowledged===true)
        res.send({message:"Comment Posted",payload:dbRes})
    else
        res.send({message:"Failed to post Comment"})
  }))
module.exports=alumniApp