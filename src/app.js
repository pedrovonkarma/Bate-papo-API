import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi'
import dayjs from 'dayjs';
dotenv.config();
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;
mongoClient.connect(() => {
    db = mongoClient.db();
});
const app = express();
app.use(express.json());
app.post('/participants', async (req, res) => {
    const nome = req.body.name;
    const userSchema = joi.object({
        name: joi.string().required()
    })
    const validation = userSchema.validate(req.body)
    if (validation.error) {
        return res.status(422).send(validation.error.details)
    }
    try {
        const namae = await db.collection('participants').findOne({ name: nome })
        if (namae) {
            return res.sendStatus(409);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
    const hora = dayjs().format('HH:mm:ss')
    const obj2 = {from: nome, to: 'Todos', text: 'entra na sala...', type: 'status', time: hora}
    const obj = { name: nome, lastStatus: Date.now() }
    try {
        await db.collection('participants').insertOne(obj)
        await db.collection('messages').insertOne(obj2)
        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});
app.post('/messages', async (req, res) => {
    const usuario = req.headers.user
    try {
        const namae = await db.collection('participants').findOne({ name: usuario })
        if (!namae) {
            return res.sendStatus(422);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
    const userSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("message", "private_message").required()
    })
    const validation = userSchema.validate(req.body)
    if (validation.error) {
        return res.status(422).send(validation.error.details)
    }
    const hora = dayjs().format('HH:mm:ss')
    const obj = {from: usuario, to: req.body.to, text: req.body.text, type: req.body.type, time: hora}
    try {
        await db.collection('messages').insertOne(obj)
        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})
app.get('/participants', async (req, res) => {
    try {
        const partners = await db.collection('participants').find().toArray();
        res.send(partners);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})
app.get('/messages', async (req, res) => {
    let limit = Number(req.query.limit)
    const usuario = req.headers.user
        if(Object.keys(req.query).length !== 0 && isNaN(req.query.limit)){
            return res.sendStatus(422)}
        if(limit<=0){
            return res.sendStatus(422)
        }
        try {
            const msgs = await db.collection('messages').find().toArray();
            const msgss = msgs.filter((i) => i.to === usuario || i.to==='Todos' || i.from===usuario)
            res.send(msgss.slice(-limit).reverse());
        } catch (error) {
            console.error(error);
            res.sendStatus(500);
        }
    
    
})
app.post('/status', async (req, res) => {
    const usuario = req.headers.user
    try {
        const namae = await db.collection('participants').findOne({ name: usuario })
        if (!namae) {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
    try {
        const namae = await db.collection('participants').updateOne({ name: usuario }, { $set: {lastStatus: Date.now()} })
        return res.sendStatus(200)
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})
async function remover(){
    let partners
    let removidos
    try {
        partners = await db.collection('participants').find().toArray();
        partners = partners.filter((i) => ((Date.now())/1000) - ((i.lastStatus)/1000) >10)
        removidos = partners.map((i) => i.name)
    } catch (error) {
        console.error(error);
    }
    if(partners.length===0){
        return
    }
    console.log('pegou as listas')
    const hora = dayjs().format('HH:mm:ss')
    const msgs = removidos.map((i) => ({from: i, to: "Todos", text: 'sai da sala...', type: 'status', time: hora}))
    try {

        for (let index = 0; index < removidos.length; index++) {
            await db.collection('participants').deleteOne({name: removidos[index]})
            
        }
        await db.collection('messages').insertMany(msgs)
        return
    } catch (error) {
        console.error(error);
    }
}
app.listen(5000)
setInterval(remover, 15000);