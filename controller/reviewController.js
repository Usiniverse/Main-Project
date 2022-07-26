const { reviews, images, hosts, sequelize, Sequelize } = require("../models");

//review 불러오기

async function readReview(req, res) {
   //try {
        const {userId} = res.locals;
        const {hostId} = req.params;
       
        const review = await reviews.findAll({
            where: {
                hostId
            },
            include: [{
                model: images,
                attributes: ['reviewId', 'userImageURL']
            }],
            order: [
                ["reviewId", "DESC"],
                
            ],
                
            
        });
                    res.status(200).send({review,  msg : "후기를 읽어옵니다."});

    // } catch (error) {
    //     res.status(400).send({errorMessage: "댓글 조회에 실패하였습니다." });
    // }
}

//review 작성하기

async function writeReview(req, res) {
    const {hostId} = req.params;
    const {nickname, userId, userImageURL} = res.locals;
    const {review, starpoint} = req.body;

    if (!userId) {
        res.status(400).send({
            errorMessage : "후기를 남기려면 로그인이 필요해요",
        });
        return;
    }
//try {
    if(!review) {
        res.status(412).send({
          errorMessage:"후기를 입력해 주세요.",
        });
        return;
    }
    const review_r = await reviews.create({
        hostId:hostId,
        userId:userId,
        nickname:nickname,
        review:review,
        userImageURL:userImageURL,
        starpoint:starpoint
    });
    const rimg = await images.create({
        reviewId : review_r.reviewId,
        userImageURL:userImageURL,
    })

    res.status(201).send({review_r, rimg, msg : "후기 작성 완료!"});
// } catch (error) {
//     res.status(400).send({result:false, errorMessage: "후기 작성을 할 수 없습니다."});
// }
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
    console.log(existReview, ' 로그 찍어보자');
    if (!userId) {
        res.status(400).send({errorMessage:"로그인 후 수정 할 수 있습니다."});
        return;
    }
    else if (existReview.userId != userId) {
        res.status(400).send({
            errorMessage:"후기는 작성자만 수정 할 수 있습니다."
        });
        return;
    }
    const updateReview = await existReview.update(
        {review : review},
        {starpoint : starpoint},
        {updateAt: Date()}
    );
    res.status(200).send({review, updateReview, msg : "후기 수정 완료."});
} catch (error) {
    res.status(400).send({errorMessage : "후기를 수정 할 수 없습니다."});        
    }
}

//review 삭제하기

async function deleteReivew(req, res) {
    const { userId } = res.locals;
    const { reviewId } = req.params;
//try {
    const existReview = await reviews.findOne({
        where: {
            userId,
        },
    });
    console.log(existReview, '작성된 리뷰');
    if (!userId) {
        res.status(400).send({errorMessage:"로그인 후 수정 할 수 있습니다."});
        return;
    }
    else if (existReview.userId != userId) {
        res.status(400).send({
            errorMessage:"후기는 작성자만 수정 할 수 있습니다."
        });
        return;
    }

    const deleteReivew = await reviews.destroy({where : {reviewId}});
    if (!deleteReivew) {
        res.status(400).send({errorMessage : "후기 삭제가 정상적으로 처리되지 않았습니다."});
        return;
    }
    res.status(200).send({msg:"후기 삭제 완료!"});
// } catch (error) {
//     res.status(400).send({errorMessage: "후기를 삭제 할 수 없습니다."});
//   }
}

module.exports = {deleteReivew, updateReview, writeReview, readReview}