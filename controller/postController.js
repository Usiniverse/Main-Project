const PostDB = require("../models/posts");
const CommentDB = require("../models/comments");
const UserDB = require("../models/users");


// 게시글 작성(S3 기능 추가 예정)
async function WritePosting (req, res) {

    try{
        const { title, postContent, tripLocation } = req.body;
        const { nickname } = req.locals;

        const unixTime = getUnixTimeStamp();

        const post = await PostDB.create({
        nickname, title, postContent, tripLocation, unixTime,
        imageURL: req.files.map(file=>file.location), 
        imageKey: req.files.map(file=>file.key)        
        })
        
        res.status(201).send(post);
    }
    catch(e)
    {
        res.status(402).send({ errorMessage : "게시글이 등록되지 않았습니다."});
    }
};


// 게시글 전체 조회
async function GetPostingList (req, res) {
    const postingList = await PostDB.find().sort({ createAt: 'desc' });

    res.send.json(postingList);
}


// 게시글 상세 조회(S3 기능 추가 예정)
async function GetPost (req, res) {
    const { userId } = res.locals;
    const { postId } = req.params;

    const post = await PostDB.findById( postId );
    const postWriter = await UserDB.findOne( post.nickname, );
    const comments = await CommentDB.find({ postId:postId });
    
    const commentWriterIds = comments.map(
        (commentWriterId) => commentWriterId.nickname
    );

    const postImage = req.files.map(file=>file.location);

    const commentWriterInfoById = await UserDB.find({
        _id: { $in: commentWriterIds },
    })
        .exec()
        .then((commentWriterId) => 
            commentWriterId.reduce(
                (prev,ca) => ({
                    ...prev,
                    [ca.nickname]: ca,
                }),
                {}
            ));

    const postsInfo = {
        postId: post._id,
        title: post.title,
        content: post.content,
        nickname: post.nickname,
        postContent: post.postContent,
        postImage: post.postImage,
        tripLocation: postWriter.tripLocation,
    }

    const commentInfo = comments.map((comment) => ({
        commentId : comment.commentId,
        comment: comment.comment,
        commentWriter: commentWriterInfoById[comment.nickname],
    }));

    res.send({
        posts : postsInfo,
        commentInfo: commentInfo
    });
};


// 게시글 수정 (S3 기능 추가 예정)
async function ModifyPosting (req, res) {
    const { nickname } = res.locals;
    const { postId } = req.params;
    const { title, postImage, postContent, tripLocation } = req.body;
    const findPost = await PostDB.findById(postId);

    // const images = await Content.create({
    //     imageURL: req.files.map(file=>file.location), 
    //     imageKey: req.files.map(file=>file.key)
    // });

    const ModifyPost = await PostDB.findByIdAndUpdate(postId, {
        $set:{ 
            title:title, 
            postImage:postImage, 
            postContent:postContent, 
            tripLocation:tripLocation
        }
    });

    res.send({ ModifyPost, msg: "게시글이 수정되었습니다!"});

    if (nickname !== findPost.nickname) {
        await res.status(400).send({ errorMessage: "접근 권한이 없습니다!"});
    };
};


// 게시글 삭제 (S3 이미지 삭제 기능 추가 예정)
async function DeletePost (req, res) {
    try {
        const { nickname } = res.locals;
    const { postId } = req.params;
    const findPost = await PostDB.findById(postId);

    if (nickname === findPost.nickname) {
        await CommentDB.deleteMany({ postId:postId })
        await PostDB.findByIdAndDelete(postId)
    } 

    res.send({ msg: "게시글이 삭제되었습니다!" });
    } catch (e) {
        if (nickname !== findPost.nickname) {
            await res.status(400).send({ errorMessage: "접근 권한이 없습니다!"});
        };
    }
};

