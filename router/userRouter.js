const express = require("express");
const passport = require("passport")
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

const {
    kakaoCallback,
    naverCallback,
    googleCallback,
    checkMe
} = require("../controller/userController")


//카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', kakaoCallback);



//구글 로그인

router.get('/google', passport.authenticate('google', {scope: ['profile'],}))
router.get('/google/callback', googleCallback)




//네이버 로그인
router.get('/naver', passport.authenticate('naver', { authType: 'reprompt' }))
router.get('/naver/callback', naverCallback)




// 내 정보 조회 API, 로그인 시 사용
router.get('/me', authMiddleware, checkMe);


module.exports = router;