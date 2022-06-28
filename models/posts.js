const mongoose = require("mongoose");
const moment = require("moment");

const PostSchema = mongoose.Schema(
    {
        nickname:String,
        postId:String,
        title:String,
        postImage:String,
        postContent:String,
        commentNum:{ type : Number, default:0 },
        likeNum:{ type: Number, default: 0 },
        tripLocation:String
    }
);

PostSchema.virtual('userId').get(function () { 
    return this._id.toHexString(); 
});

PostSchema.set('toJSON', { virtuals: true });

export async function getUnixTimeStamp() {
    return moment().unix();
}

module.exports = mongoose.model("Post", PostSchema);

