require('dotenv').config();
const express = require("express");
const passport = require("passport");
const authMiddleware = require("../middlewares/auth-middleware");
const { users, sequelize, Sequelize } = require("../models");
const router = express.Router();
const {
    kakaoCallback,
    naverCallback,
    googleCallback,
    checkMe,
    Mypage,
    MypagePutname,
    MypagePutImage,
    CNU_CK,
    otherUser
    
} = require("../controller/userController")
const upload = require("../middlewares/S3-middleware");



//카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', kakaoCallback);


//구글 로그인
router.get('/google', passport.authenticate('google', {scope: ['profile'],}))

router.get('/google/callback', googleCallback)


//네이버 로그인
router.get('/naver', passport.authenticate('naver', { authType: 'reprompt' }))

router.get('/naver/callback',  naverCallback)


// 내 정보 조회 API, 로그인 시 사용
router.get('/me', authMiddleware, checkMe);


//마이페이지 정보


router.get('/mypage/:userId', authMiddleware, Mypage)

//마이페이지 정보 수정
router.put('/mypage/:userId/nick', authMiddleware, MypagePutname)

// 프로필 이미지 수정
router.put('/mypage/:userId/img', authMiddleware, upload.array('images', 1), MypagePutImage)

//사업자 등록번호 조회
router.put('/mypage/checkCNU', authMiddleware, CNU_CK)

//다른 유저의 정보 조회
router.get('/other/:userId', otherUser)


module.exports = router;