import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import authRoutes from './routes/auth.js';
import Url from './models/Url.js';
import { z } from 'zod';
const app = express();
import isAuth from './middleware/auth.js';

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
app.use(authRoutes)

app.post("/shorten", isAuth, async (req, res) => {
    const body = req.body;

    const result = urlSchema.safeParse(body);

    if (result.success === false) {
        return res.status(400).send(" a validUrl is required");
    }
    const shortCode = nanoid(6);
    const newUrl = new Url({
        originalUrl: result.data.url,
        shortCode: shortCode,
        owner: req.userId,
    });
    try {

        await newUrl.save();
    } catch (err) {
        console.error('Error saving URL:', err);
        return res.status(500).send("Internal Server Error");
    }
    res.send("This is your new url: " + process.env.BASE_URL + "/" + shortCode);
})

app.get("/my-links", isAuth, async (req, res) => {
    try {
        const urls = await Url.find({ owner: req.userId }).sort({ createdAt: -1 })

        const formattedUrls = urls.map(url => ({
            originalUrl: url.originalUrl,
            shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
            createdAt: url.createdAt,
        }));
        res.json(formattedUrls);
    } catch (err) {
        console.error('Error retrieving URLs:', err);
        return res.status(500).send("Internal Server Error");
    }
})

app.get("/:shortCode", async (req, res) => {
    const shortCode = req.params.shortCode;
    try {
        const url = await Url.findOne({ shortCode: shortCode });
        if (!url) {
            return res.status(404).send("Url not found");
        }
        res.redirect(url.originalUrl);
    } catch (err) {
        console.error('Error retrieving URL:', err);
        return res.status(500).send("Internal Server Error");
    }
})


