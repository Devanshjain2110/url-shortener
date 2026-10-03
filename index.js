import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import Url from './models/Url.js';
import { z } from 'zod';
const app = express();

const urlSchema = z.object({
    url: z.url({ protocol: /^https?$/ }),
})
dotenv.config();
mongoose.connect(process.env.MONGO_URI).then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    })
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});
app.use(express.json());

app.post("/shorten", async (req, res) => {
    const body = req.body;

    const result = urlSchema.safeParse(body);

    if (result.success === false) {
        return res.status(400).send(" a validUrl is required");
    }
    const shortCode = nanoid(6);
    const newUrl = new Url({
        originalUrl: result.data.url,
        shortCode: shortCode,
    });
    try {

        await newUrl.save();
    } catch (err) {
        console.error('Error saving URL:', err);
        return res.status(500).send("Internal Server Error");
    }
    res.send("This is your new url: " + process.env.BASE_URL + "/" + shortCode);
})


