import express from 'express';
import morgan from 'morgan';
import mongoose, { ConnectOptions } from 'mongoose';
import 'dotenv/config';

import businessRouter from './routes/business';

const app = express();

console.log("Connecting to MongoDB");
mongoose.connect(process.env.MONGODB_URI as string, {
    useNewUrlParser: true,
    useUnifiedTopology: true
} as ConnectOptions)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.log(err);
    });

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/business', businessRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});