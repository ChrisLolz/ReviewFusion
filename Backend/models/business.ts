import mongoose from "mongoose";

interface Business extends mongoose.Document{
    name: string;
    address: string;
    city: string;
    image: string;
    ratings: Rating[];
    reviews: mongoose.Types.ObjectId[];
    _id: mongoose.Types.ObjectId;
}

interface Rating {
    source: string;
    rating: number;
}

const businessSchema = new mongoose.Schema<Business>({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true},
    image: { type: String },
    ratings: [{ 
        source: { type: String, required: true },
        rating: { type: Number, required: true }
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }]
});

const businessModel = mongoose.model<Business>("Business", businessSchema);

export default businessModel;