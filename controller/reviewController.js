const {
  reviews,
  images,
  users,
  hosts,
  sequelize,
  Sequelize,
} = require("../models");

//review 불러오기

async function readReview(req, res) {
  try {
    const { hostId } = req.params;

    const reviewInfo = await reviews.findAll({
      where: {
        hostId,
      },
      include: [
        {
          model: users,
          attributes: ["userImageURL", "nickname"],
        },
      ],
      order: [["reviewId", "DESC"]],
    });
  
      for (let i = 0; i < reviewInfo.length; i++) {
        let Review = reviewInfo[i];
        const writtenTime = Date.parse(Review.createdAt);
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
               Review = {
               reviewId:Review.reviewId,
                userId: Review.userId,
              hostId:Review.hostId,
              review: Review.review,
              starpoint: Review.starpoint,
              nickname:Review.user.nickname,
              user:Review.user,
              createdAt: betweenTime + value.time + "전",
               };
              reviewInfo[i] = Review;
              break;
            } else {
               Review = {
              reviewId:Review.reviewId,
              userId: Review.userId,
              hostId:Review.hostId,
              review: Review.review,
              starpoint: Review.starpoint,
              nickname:Review.user.nickname,
              user:Review.user,
              createdAt: "방금전",
               };
              reviewInfo[i] = Review;
            }
          }
        }
      
    res.status(200).send({ reviewInfo, msg: "후기를 읽어옵니다." });
  } catch (error) {
    res.status(400).send({ errorMessage: "후기 조회에 실패하였습니다." });
  }
}

//review 작성하기

async function writeReview(req, res) {
  const { hostId } = req.params;
  const { nickname, userId, userImageURL } = res.locals;
  const { review, starpoint } = req.body;

  if (!userId) {
    res.status(400).send({
      errorMessage: "후기를 남기려면 로그인이 필요해요",
    });
    return;
  }
  try {
    if (!review) {
      res.status(412).send({
        errorMessage: "후기를 입력해 주세요.",
      });
      return;
    }
    const review_r = await reviews.create({
      hostId: hostId,
      userId: userId,
      nickname: nickname,
      review: review,
      starpoint: starpoint,
    });

    res.status(201).send({ review_r, msg: "후기 작성 완료!" });
  } catch (error) {
    res
      .status(400)
      .send({ result: false, errorMessage: "후기 작성을 할 수 없습니다." });
  }
}

//review 수정

async function updateReview(req, res) {
  const { userId } = res.locals;
  const { reviewId } = req.params;
  const { review, starpoint } = req.body;

  try {
    const existReview = await reviews.findOne({
      where: { reviewId },
    });

    if (!userId) {
      res.status(400).send({ errorMessage: "로그인 후 수정 할 수 있습니다." });
      return;
    } else if (existReview.userId != userId) {
      res.status(400).send({
        errorMessage: "후기는 작성자만 수정 할 수 있습니다.",
      });
      return;
    }
    const updateReview = await existReview.update(
      { review: review },
      { starpoint: starpoint },
      { updateAt: Date() }
    );
    res.status(200).send({ review, updateReview, msg: "후기 수정 완료." });
  } catch (error) {
    res.status(400).send({ errorMessage: "후기를 수정 할 수 없습니다." });
  }
}

//review 삭제하기

async function deleteReivew(req, res) {
  const { userId } = res.locals;
  const { reviewId } = req.params;
  try {
    const existReview = await reviews.findOne({
      where: {
        userId,
      },
    });

    if (!userId) {
      res.status(400).send({ errorMessage: "로그인 후 수정 할 수 있습니다." });
      return;
    } else if (existReview.userId != userId) {
      res.status(400).send({
        errorMessage: "후기는 작성자만 수정 할 수 있습니다.",
      });
      return;
    }

    const deleteReivew = await reviews.destroy({ where: { reviewId } });
    if (!deleteReivew) {
      res
        .status(400)
        .send({ errorMessage: "후기 삭제가 정상적으로 처리되지 않았습니다." });
      return;
    }
    res.status(200).send({ msg: "후기 삭제 완료!" });
  } catch (error) {
    res.status(400).send({ errorMessage: "후기를 삭제 할 수 없습니다." });
  }
}

module.exports = { deleteReivew, updateReview, writeReview, readReview };
