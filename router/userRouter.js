const express = require("express");
const passport = require("passport")
const authMiddleware = require("../middlewares/auth-middleware");
const userController = require("../controller/userController");
const router = express.Router();

const {
    kakaoCallback,
    checkMe
} = require("../controller/userController")


//카카오 로그인
router.get('/kakao', kakaoCallback);
router.get('/kakao/callback', passport.authenticate('kakao'));



// 내 정보 조회 API, 로그인 시 사용
router.get('/me', authMiddleware, checkMe);


module.exports = router;