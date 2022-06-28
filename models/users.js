const mongoose = require("mongoose");


const UserSchema = mongoose.Schema(
    {
        userId : {
            type : String,
            require : true,
            unicqe:true
        },
        nickname:String,
        userImage:String,
        email:String
        
    }
);

module.exports = mongoose.model("User", UserSchema);