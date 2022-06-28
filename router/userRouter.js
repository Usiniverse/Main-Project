const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const userController = require("../controller/userController");
const router = express.Router();



//카카오 로그인
router.get('/kakao', userController.passport.authenticate('kakao'))


//카카오 콜백
router.get('/kakao/callback', userController.kakaoCallback);



// 내 정보 조회 API, 로그인 시 사용
router.get('/me', authMiddleware, userController.checkMe);


module.exports = router;