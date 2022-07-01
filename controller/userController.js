const jwt = require("jsonwebtoken");
const UserDB = require("../models/user");

//카카오 로그인

const kakaoCallback = (req, res, next) => {
    passport.authenticate('kakao',{ failureRedirect: '/' },(err, user) => {
            if (err) return next(err)
            console.log('콜백')
            const { userId, nickname, userImage } = user;
            const token = jwt.sign({ userId }, process.env.MY_KEY)

            result = {
                token,
                userId,
                nickname,
                userImage,
                email
            }
            console.log('카카오 콜백 함수 결과', result)
            res.send({ user: result })
        }
    )(req, res, next)
}
// 구글 로그인

const googleCallback = (req, res, next) => {
  passport.authenticate(
      'google',
      { failureRedirect: '/' },
      (err, user, info) => {
          if (err) return next(err)
          console.log('콜백')
          const { userId, nickname, userImg } = user
          const token = jwt.sign({ userId }, process.env.MY_KEY)

          result = {
              token,
              userId,
              nickname,
              userImg
          }
          console.log('구글 콜백 함수 결과', result)
          res.send({ user: result })
      }
  )(req, res, next)
}




// 네이버 로그인

const naverCallback = (req, res, next) => {
  passport.authenticate(
      'naver',
      { failureRedirect: '/' },
      (err, user, info) => {
          if (err) return next(err)
          console.log('콜백')
          const { userId, nickname, userImg } = user
          const token = jwt.sign({ userId }, process.env.MY_KEY)

          result = {
              token,
              userId,
              nickname,
              userImg
          }
          console.log('네이버 콜백 함수 결과', result)
          res.send({ user: result })
      }
  )(req, res, next)
}


//로그인 인증 미들웨어
async function checkMe(req, res) {
    const { user } = res.locals;
    res.send({
      user:{
        nickname: user.nickname,
        email: user.email
      }
    });
  };

// 마이페이지
async function mypage(req, res) {
  const nickname = res.locals.nickname
  const userImage = res.locals.userImage
  
}



module.exports = {
  kakaoCallback, googleCallback, naverCallback,
  checkMe, mypage
}