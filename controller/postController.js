const { posts, Comment, User, images, sequelize, Sequelize } = require("../models");
const multiparty = require("multiparty");
const AWS = require("aws-sdk");

// Node.js, MySQL

// 게시글 작성(유저)
async function WritePosting (req, res) {
    // try {
        // const { userId, snsId, nickname } = res.locals;
        const { title, content, tripLocation, category, type, link, houseTitle } = req.body;
        // console.log(req.body);
        const image = req.files;
        // console.log(req.files);

        const postImageKEY = image.map(postImageKEY => postImageKEY.key);
        const postImageURL = image.map(postImageURL => postImageURL.location);

        const thumbnailKEY = postImageKEY[0];
        const thumbnailURL = postImageURL[0];

        const postInfo = await posts.create({ 
            title, content, tripLocation, category, type, link, houseTitle,
            thumbnailURL: thumbnailURL.toString(),
            thumbnailKEY: thumbnailKEY.toString(),
            postImageURL: postImageURL.toString(),
            postImageKEY: postImageKEY.toString(),
        });

        res.status(201).send({ postInfo, postImageKEY, postImageURL });
    // } catch(e) {
    //     res.status(402).json({ errorMessage : "게시글이 등록되지 않았습니다."});
    // }
};



// 게시글 전체 조회
async function GetPostingList (req, res) {
    const allPost = await posts.findAll()

    res.send({ allPost });
}


// 게시글 상세 조회(S3 기능 추가 예정)
async function GetPost (req, res) {
    // const { nickname, userId } = res.locals;
    const { postId } = req.params;
    const image = req.files;

    const post = await posts.findAll({ where: { postId }, 
        order : [[ "createdAt", "DESC" ]]
    });
    console.log(post);

    // const comments = await Comment.findOne({ where: { postId },
    //     order : [[ "createdAt", "DESC" ]] 
    // });

    // const postImage = await images.findOne({ where : { postId, postImageKEY, postImageURL },
    //     order : [[ "createdAt", "DESC" ]]
    // });
    // console.log(postImage);
    
    const commentWriterIds = Comment.map(
        (commentWriterId) => commentWriterId.nickname
    );

    // const postImage = req.files.map(file=>file.location);

    const commentWriterInfoById = await User.find({
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
        postImage: postImage.postImage,
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
    // try {
        // const { nickname } = res.locals;
        const { postId } = req.params;
        const { title, content, tripLocation, category, type, link, houseTitle } = req.body;
        const image = req.files;

        const existPost = await posts.findOne({
            where: { postId },
        });

        const postImageKEY = image.map(postImageKEY => postImageKEY.key);
        const postImageURL = image.map(postImageURL => postImageURL.location);

        const imageURL = existPost.postImageURL.map(imageURL => imageURL.split('com/')[1]);

        const s3 = new AWS.S3();
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delete: { Objects: imageURL.map(imageKey => ({ Key: imageKey })) }
        };
        console.log(params);

        s3.deleteObjects(params, function(err, data) {
            if (err) console.log(err, err.stack);
            else { console.log("삭제되었습니다.") }
        })
    
        // if (nickname !== existPost.nickname) {
        //         await res.status(400).send({ errorMessage: "접근 권한이 없습니다!"});
        //     };
    
        const ModifyPost = await existPost.update({
            title, 
            content, 
            tripLocation,
            postImageKEY: postImageKEY.toString(),
            postImageURL: postImageURL.toString(),
            category, type, link, houseTitle,
            order: [["updatedAt", "DESC"]]
        });
    
        res.send({ ModifyPost, msg: "게시글이 수정되었습니다!"});
    // } catch (e) {
    //     res.status(400).send({ errorMessage: "게시글을 수정을 할 수 없습니다." });
    // }
};


// 게시글 삭제 (S3 이미지 삭제 기능 추가 예정)
async function DeletePost (req, res) {
    // try {
        // const { userId } = res.locals;
        const { postId } = req.params;

        const existPost = await posts.findOne({ where:{ postId }});
        console.log(existPost);

        // const s3 = new AWS.S3();
        // const params = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Delete: { Objects: postImageKEY.map(postImageKEY => ({ Key: postImageKEY })) }
        // };
        // console.log(params);

        // s3.deleteObjects(params, function(err, data) {
        //     if (err) console.log(err, err.stack);
        //     else { console.log("삭제되었습니다.") }
        // })

        // 댓글, 게시글 삭제
        if (existPost) {
            await Comment.destroy({ 
                where: { postId } 
            });
            await posts.destroy({
                where: { postId }
            });
        };

        res.send({ msg: "게시글이 삭제되었습니다!" });
    // } catch (e) {
    //     res.status(400).send({ errorMessage: "접근 권한이 없습니다!"});
    // }
};

exports = module.exports = {
    WritePosting,
    GetPostingList,
    GetPost,
    ModifyPosting,
    DeletePost
}