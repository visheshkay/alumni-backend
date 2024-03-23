const exp = require('express')
const app = exp()
require('dotenv').config()
const mc = require('mongodb').MongoClient;
const path = require('path')
app.use(exp.json())

mc.connect(process.env.DB_URL)
.then(client=>{
    const alumnidb = client.db('alumniconnect')
    const studentscollection = alumnidb.collection('studentscollection')
    const alumnicollection = alumnidb.collection('alumnicollection')
    const discollection = alumnidb.collection('discussionscollection')
    let eventcollection = alumnidb.collection('eventcollection')
    app.set('studentscollection',studentscollection)
    app.set('alumnicollection',alumnicollection)
    app.set('discollection',discollection)
    app.set('eventcollection',eventcollection)
    console.log("DB connection success")
})
.catch(err=>{
    console.log("Error in db connection")
})
app.use(exp.static(path.join(__dirname,'../client/build')))


const alumniApp = require('./api/alumniapi')
const studentapp = require('./api/studentsapi')


app.use('/alumni-api',alumniApp)
app.use('/student-api',studentapp)
app.use((req,res,next)=>{
    res.sendFile(path.join(__dirname,'../client/build/index.html'))
})
app.use((err,req,res,next)=>{
    res.send({message:"error",payload:err.message});
})
const port = process.env.PORT || 5000;
app.listen(port,()=>{ console.log(`web server running on port ${port}`)
})