import express from 'express';
import 'dotenv/config';

import yelpRouter from './routes/yelp';
import businessRouter from './routes/business';

const app = express();

app.use(express.json());

app.use('/api/yelp', yelpRouter);
app.use('/api/business', businessRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});