import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import joi from 'joi'
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
        name: joi.string().required(),
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



    const obj = { name: nome, lastStatus: Date.now() }
    try {
        await db.collection('participants').insertOne(obj)
        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

app.get('/participants', async (req, res) => {
    try {
        const partners = await db.collection('participants').find().toArray();
        res.send(partners);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

app.listen(5000)
