import mongoose from "mongoose";

interface Business extends mongoose.Document{
    lastUpdated: Date;
    yelpId: string;
    name: string;
    address: string;
    city: string;
    image: string;
    images: string[];
    rating: number;
    review_count: number;
    price: string;
    phone: string;
    categories: string[];
    ratings: Record<string, {rating: number, count: number}>,
    reviews: mongoose.Types.ObjectId[];
    _id: mongoose.Types.ObjectId;
}

const businessSchema = new mongoose.Schema<Business>({
    lastUpdated: { type: Date, required: true },
    yelpId: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true},
    image: { type: String },
    images: { type: [String] },
    rating: { type: Number },
    review_count: { type: Number },
    price: { type: String },
    phone: { type: String },
    categories: { type: [String] },
    ratings: { type: Object },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }]
});

businessSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

const businessModel = mongoose.model<Business>("Business", businessSchema);

export default businessModel;