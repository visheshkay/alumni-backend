const exp = require('express')
const studentapp = exp.Router();
const bcryptjs = require("bcryptjs");
const verifyToken = require('../middlewares/verifytoken')
const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

require("dotenv").config();
let student;
let alumni;
let discussion;
let events;
studentapp.use((req, res, next) => {
    student = req.app.get("studentscollection");
    alumni = req.app.get("alumnicollection");
    discussion = req.app.get("discollection");
    events = req.app.get("eventcollection");
    next();
  });

  //student Registration
  studentapp.post(
    "/student",
    expressAsyncHandler(async (req, res) => {
      //get user resource from client
      const newUser = req.body;
      //check for duplicate user based on username
      const dbuser = await student.findOne({ username: newUser.username });
      //if user found in db
      if (dbuser !== null) {
        res.send({ message: "User existed" });
      } else {
        //hash the password
        const hashedPassword = await bcryptjs.hash(newUser.password, 6);
        //replace plain pw with hashed pw
        newUser.password = hashedPassword;
        //create user
        await student.insertOne(newUser);
        //send res
        res.send({ message: "User created" });
      }
    })
  );

  //student Login
  studentapp.post('/login',expressAsyncHandler(async(req,res)=>{
    // get user resource from req
    const usercredobj=req.body;
    // verify user
    const dbuser=await student.findOne({username:usercredobj.username})
    // if user is not present
    if(dbuser===null){
        res.send({messsage:'Invalid Username'})
    }
    else{
        // if user is valid
        let status=await bcryptjs.compare(usercredobj.password,dbuser.password)
        // if password is not matched
       if(status===false){
        res.send({message:"Invalid Passsword"})
       }
       else{
        // if passswords are matched create jwt token
        const signedToken=jwt.sign({username:dbuser.username},process.env.SECRET_KEY,{expiresIn:'1d'})
        // send token to client as res
        res.send({message:"Login success",token:signedToken,user:dbuser})
       }
    }
}))
// 
studentapp.post('/new-discussion',expressAsyncHandler(async(req,res)=>{
  const newDis = req.body;
  console.log(newDis)
  await discussion.insertOne(newDis)
  res.send({message:"new discussion created"});
}))
// get discussions by current user
studentapp.get('/discussions/:username',expressAsyncHandler(async (req,res)=>{
  const name = req.params.username 
  const mydis = await discussion.find({status:true,username:name}).toArray()
  res.send({message:"your discussions",payload:mydis})

}))
// get all discussions
studentapp.get('/discussions',expressAsyncHandler(async(req,res)=>{
  const alldis = await discussion.find({status:true}).toArray()
  res.send({message:"all discussions",payload:alldis})
}))
// comment
studentapp.post('/comment/:did',expressAsyncHandler(async(req,res)=>{
  let did = Number(req.params.did)
  let data = req.body
  console.log(typeof did)
  // insert comment into comments array of the dis
  let found = await discussion.findOne({disId:{$eq:did}})
  console.log(found)
  const dbRes = await discussion.updateOne({disId:did},{$addToSet:{threads:data}})
  console.log(dbRes)
  if(dbRes!=null && dbRes.acknowledged===true)
      res.send({message:"Comment Posted",payload:dbRes})
  else
      res.send({message:"Failed to post Comment"})
}))
// reply to comment
studentapp.post('/comment-reply/:id/reply/:cid',expressAsyncHandler(async(req,res)=>{
  let cid = Number(req.params.cid)
  let id = Number(req.params.id)
  let data = req.body 
  const reso = await discussion.findOne({disId:id})
  const threads = reso.threads
  const index = threads.findIndex((t)=>t.threadId==cid)
  const replies = threads[index].replies
  threads[index].replies=[...replies,data]
  const dbRes = await discussion.updateOne({disId:id},{$set:{threads:threads}})
  if(dbRes){
      res.send({message:"reply posted"})
  }
}))
// get alumni details
studentapp.get('/alumni',verifyToken,expressAsyncHandler(async(req,res)=>{
    // get all alumni
    let alumniii=await alumni.find().toArray()
    // send res
    res.send({message:"List of alumni:",payload:alumniii})
}))

// get event details
studentapp.get('/events',verifyToken,expressAsyncHandler(async(req,res)=>{
    // get all events
    let eventlist=await events.find({status:true}).toArray()
    // send res
    res.send({message:"List of events:",payload:eventlist})
}))

//post events
studentapp.post('/event/comment/:eventId',expressAsyncHandler(async (req,res)=>{
  id = Number(req.params.eventId)
  let data = req.body
  // insert comment into comments array of the article
  const dbRes = await events.updateOne({eventId:id},{$addToSet:{comments:data}})
  if(dbRes.acknowledged===true)
      res.send({message:"Comment Posted",payload:dbRes})
  else
      res.send({message:"Failed to post Comment"})
}))


// soft delete


module.exports = studentapp;