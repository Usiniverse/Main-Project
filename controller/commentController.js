const { Comments, users, images, sequelize, Sequelize } = require("../models");

//댓글 불러오기 API
async function readComment(req, res) {
  try {
    const { postId } = req.params;

    let commentInfo = await Comments.findAll({
      where: {
        postId,
      },
      include: [
        {
          model: users,
          attributes: ["nickname", "userImageURL"],
        },
      ],
      order: [["commentid", "DESC"]],
    });
for (let i = 0; i < commentInfo.length; i++) {
  let comment = commentInfo[i];
  const writtenTime = Date.parse(comment.createdAt);
  const timeNow = Date.parse(Date());
  const diff = timeNow - writtenTime;

  
    const times = [
      { time: "분", milliSeconds: 1000 * 60 },
      { time: "시간", milliSeconds: 1000 * 60 * 60 },
      { time: "일", milliSeconds: 1000 * 60 * 60 * 24 },
      { time: "주", milliSeconds: 1000 * 60 * 60 * 24 * 7 },
      { time: "달", milliSeconds: 1000 * 60 * 60 * 24 * 30 },
    ].reverse();

    for (const value of times) {
      const betweenTime = Math.floor(diff / value.milliSeconds);
      if (betweenTime > 0) {
        comment = {
          userId: comment.userId,
          commentId: comment.commentId,
          comment: comment.comment,
          userImageURL: comment.user.userImageURL,
          nickname: comment.user.nickname,
          createdAt: betweenTime + value.time + "전",
        };
        commentInfo[i] = comment;
        break;
      } else {
        Review = {
          userId: comment.userId,
          commentId: comment.commentId,
          comment: comment.comment,
          userImageURL: comment.user.userImageURL,
          nickname: comment.user.nickname,
          createdAt: "방금 전",
        };
        commentInfo[i] = comment;
      }
    }
  }

    // const commentInfo = await comments.map((commentinfo) => ({
    //   userId: commentinfo.userId,
    //   commentId: commentinfo.commentId,
    //   comment: commentinfo.comment,
    //   userImageURL: commentinfo.user.userImageURL,
    //   nickname: commentinfo.user.nickname,
    // }));
    res.status(200).send({ commentInfo, msg: "댓글을 읽었습니다." });
  } catch (error) {
    res.status(400).send({ errorMessage: "댓글 조회에 실패하였습니다." });
  }
}

// 댓글 작성 API
async function writeComment(req, res) {
  const { postId } = req.params;
  const { nickname, userId, userImageURL } = res.locals;
  const { comment } = req.body;

  if (!userId) {
    res.status(400).send({
      errorMessage: "로그인이 필요한 서비스 입니다.-댓글작성",
    });
    return;
  }
  try {
    if (!comment) {
      res.status(412).send({
        errorMessage: "댓글을 입력해 주세요.",
      });
      return;
    }

    const comment_c = await Comments.create({
      postId: postId,
      userId: userId,
      userImageURL: userImageURL,
      comment: comment,
      nickname: nickname,
    });
    res.status(201).send({ comment_c, msg: "댓글이 등록 되었습니다." });
  } catch (err) {
    res
      .status(400)
      .send({ result: false, errorMessage: "댓글 작성을 할 수 없습니다." });
  }
}

// 댓글 수정 API
async function updateComment(req, res) {
  const { userId } = res.locals;
  const { commentId } = req.params;
  const { comment } = req.body;

  try {
    const existsComment = await Comments.findOne({
      where: { commentId },
    });

    if (!userId) {
      res.status(400).send({
        errorMessage: "로그인이 필요한 서비스 입니다.-댓글수정-",
      });
      return;
    } else if (existsComment.userId != userId) {
      res.status(400).send({
        errorMessage: "댓글 작성자만 댓글을 수정할 수 있습니다.",
      });
      return;
    }
    const updateComment = await existsComment.update(
      { comment: comment },
      { updatedAt: Date() }
    );
    res.status(200).send({ comment, updateComment, message: "댓글 수정 완료" });
  } catch (err) {
    res.status(400).send({ errorMessage: "댓글 수정을 할 수 없습니다." });
  }
}

async function deleteComment(req, res) {
  const { userId } = res.locals;
  const { commentId } = req.params;
  try {
    const existsComment = await Comments.findOne({
      where: {
        commentId: commentId,
      },
    });
    if (!userId) {
      res.status(400).send({
        errorMessage: "로그인이 필요한 서비스 입니다.-댓글삭제-",
      });
      return;
    } else if (userId != existsComment.userId) {
      res.status(400).send({
        errorMessage: "이 글의 작성자만 글을 삭제할 수 있습니다.",
      });
      return;
    }

    const deleteComment = await Comments.destroy({ where: { commentId } });
    if (!deleteComment) {
      res
        .status(400)
        .send({ errorMessage: "댓글 삭제가 정상적으로 처리되지 않았습니다." });
      return;
    }
    res.status(200).send({ message: "댓글 삭제 완료" });
  } catch (err) {
    res.status(400).send({ errorMessage: "댓글 삭제를 할 수 없습니다." });
  }
}

module.exports = { readComment, writeComment, updateComment, deleteComment };
