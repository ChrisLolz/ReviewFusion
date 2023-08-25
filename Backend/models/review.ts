import mongoose from "mongoose";

interface Review {
    source: string;
    name: string;
    date: string;
    business: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
}

const reviewSchema =  new mongoose.Schema<Review>({
    source: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },
    rating: { type: Number, required: true },
    comment: { type: String }
});

const reviewModel = mongoose.model<Review>("Review", reviewSchema);

export default reviewModel;