const {
  posts,
  Comments,
  Like,
  users,
  images,
  sequelize,
  Sequelize,
} = require("../models");
const multiparty = require("multiparty");
const AWS = require("aws-sdk");
const { post } = require("../router/likeRouter");

// 게시글 작성(유저)
async function WritePosting(req, res) {
  // try {
  console.log(res.locals);
  const { userId, nickname, userImage } = res.locals;
  const {
    title,
    content,
    mainAddress,
    subAddress,
    category,
    type,
    link,
    houseTitle,
    imageKEY,
  } = req.body;
  const image = req.files;
  // console.log(req.files);

  const postImageKEY = image.map((postImageKEY) => postImageKEY.key);
  const postImageURL = image.map((postImageURL) => postImageURL.location);
  const thumbnailKEY = postImageKEY[0];
  const thumbnailURL = postImageURL[0];

  let isLike = false;

  const postInfo = await posts.create({
    userId,
    userImage,
    nickname,
    title,
    content,
    mainAddress,
    subAddress,
    category,
    type,
    link,
    houseTitle,
    commentNum: 0,
    likeNum: 0,
    isLike: isLike,
  });

  const imagesInfo = await images.create({
    postNumber: postInfo.postId,
    thumbnailURL: thumbnailURL.toString(),
    thumbnailKEY: thumbnailKEY.toString(),
    postImageURL: postImageURL.toString(),
    postImageKEY: postImageKEY.toString(),
  })
  console.log(imagesInfo);

  res.status(201).send({ postInfo, imagesInfo });
  // } catch(e) {
  //     res.status(402).json({ errorMessage : "게시글이 등록되지 않았습니다."});
  // }
}

// 게시글 전체 조회
async function GetPostingList(req, res) {
  let allPost = await posts.findAll();
  const user = res.locals;
  
  console.log("불린 전", user);
  for (i = 0; i < allPost.length; i++) {
    let post = allPost[i];
    const postComments = await Comments.findAll({
      where: { postId: post.postId },
    });
    const postLikes = await Like.findAll({ where: { postId: post.postId } });
    let islike = await Like.findOne({
      where: { userId: post.userId, postId: post.postId },
    });
    // console.log(post, islike);
    const likeNum = postLikes.length;
    const commentNum = postComments.length;
      // console.log("불린 전", userId, post.postId, i, "번째값입니다");
    if (islike) {
      islike = true;
    } else {
      islike = false;
    }
    console.log(islike);
    Object.assign(post, {
      likeNum: likeNum,
      commentNum: commentNum,
      islike: islike,
    });
    // return
  }

  res.send({ allPost });
}

// 게시글 상세 조회(S3 기능 추가 예정)
async function GetPost(req, res) {
  const { nickname, userId } = res.locals;
  const { postId } = req.params;

  const post = await posts.findAll({ 
    include: [{
      model: Comments,
      required: true
      // attributes: ['postNumber', 'postImageURL', 'thumbnailURL']
    }],
    where: { postId },
  });

  const postComments = await Comments.findAll({
    where: { postId: post[0].postId },
  });

  const postImage = await posts.findOne({
    // where: { postId },
    include: [{
    model: images,
    required: true,
    attributes: ['postNumber', 'postImageURL', 'thumbnailURL']
    }],
  })

  const postImageRes = { 
    postId: postImage.postId,
    images: postImage.images
  }

  const postLikes = await Like.findAll({ where: { postId: post[0].postId } });

  let islike = await Like.findAll({
    where: { userId: post[0].userId, postId: post[0].postId}
  });

  const likeNum = postLikes.length;
  const commentNum = postComments.length;
 
  if (islike[0]) {
    islike = true;
  } else {
    islike = false;
  }
  Object.assign(post[0], {
    likeNum: likeNum,
    commentNum: commentNum,
    islike: islike,
  });

  // const comments = await Comment.findOne({ where: { postId },
  //     order : [[ "createdAt", "DESC" ]]
  // });

  // const postImage = await images.findOne({ where : { postId, postImageKEY, postImageURL },
  //     order : [[ "createdAt", "DESC" ]]
  // });
  // console.log(postImage);

  // const commentInfo = comments.map((comment) => ({
  //     commentId : comment.commentId,
  //     comment: comment.comment,
  //     commentWriter: commentWriterInfoById[comment.nickname],
  // }));

  res.send({
    nickname,
    userId,
    post,
    postImageRes
    // commentInfo: commentInfo
  });
}

// 게시글 수정 (S3 기능 추가 예정)

async function ModifyPosting(req, res) {
  // try {
  const { userId, userImage, nickname } = res.locals;
  const { postId } = req.params;
  const {
    title,
    content,
    mainAddress,
    subAddress,
    category,
    type,
    link,
    houseTitle,
    imageKEY,
  } = req.body;
  const image = req.files;

  const existPost = await posts.findOne({
    where: { postId },
  });

  if (image) {
    // 이미지가 들어오면 수정해준다
  } else {
    // 이미지가 없으면 existPost에서 찾은 이미지를 가져다 쓴다
  }

  const existImage = await images.findOne({
    where: {  }
  })

  if (nickname !== existPost.nickname) {
    res.status(400).send({ errorMessage: "접근 권한이 없습니다!" });
  }

  

  // S3 이미지 업로드 및 수정


  const ModifyPost = await existPost.update({
    userId,
    userImage,
    nickname,
    title,
    content,
    mainAddress,
    subAddress,
    category,
    type,
    link,
    houseTitle,
    thumbnailURL: thumbnailURL.toString(),
    // thumbnailKEY,
    // postImageURL: postImageURL.toString(),
    // postImageKEY: postImageKEY.toString(),
  });
  console.log(ModifyPost);

  res.status(200).send({ ModifyPost, msg: "게시글이 수정되었습니다!" });
  // } catch (e) {
  //     res.status(400).send({ errorMessage: "게시글을 수정을 할 수 없습니다." });
  // }
}

// 게시글 삭제 (S3 이미지 삭제 기능 추가 예정)
async function DeletePost(req, res) {
  // try {
  // const { userId, nickname, userImage } = res.locals;
  const { postId } = req.params;

  const existPost = await posts.findOne({ where: { postId } });
  // console.log(existPost);

  const postImageKEY = existPost.postImageKEY.split(',')
  console.log(postImageKEY);

  if (existPost) {
    const s3 = new AWS.S3();
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: { Objects: [{ Key: postImageKEY.toString() }] }
    };
    console.log(params.Delete);

    s3.deleteObjects(params, function(err, data) {
        if (err) console.log(err, 's3 deleteObject', data);
        else { console.log("삭제되었습니다.", data) }
    })
  }
  

  // 댓글, 게시글 삭제
  // if (userId !== existPost.userId) {
  //     res.send({msg: "삭제할 수 없습니다."})
  // };
  // if (nickname !== existPost.nickname) {
  //     res.send({msg: "삭제할 수 없습니다."})
  // };
  const destroyPost = await posts.destroy({ where: { postId } });
  console.log(destroyPost);
  // await Comment.destroy({
  //     where: { postId }
  // });
  res.status(200).send({ msg: "게시글이 삭제되었습니다!" });
  // } catch (e) {
  //     res.status(400).send({ errorMessage: "접근 권한이 없습니다!"});
  // }
}
module.exports.WritePosting = WritePosting;
module.exports.GetPostingList = GetPostingList;
module.exports.GetPost = GetPost;
module.exports.ModifyPosting = ModifyPosting;
module.exports.DeletePost = DeletePost;
