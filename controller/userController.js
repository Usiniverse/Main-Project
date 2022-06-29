const jwt = require("jsonwebtoken");
const UserDB = require("../models/users");

//카카오 로그인

const kakaoCallback = (req, res, next) => {
    passport.authenticate('kakao',{ failureRedirect: '/' },(err, user) => {
            if (err) return next(err)
            console.log('콜백')
            const { userId, nickName, userImage } = user;
            const token = jwt.sign({ userId }, process.env.MY_KEY)

            result = {
                token,
                userId,
                nickName,
                userImage,
                email
            }
            console.log('카카오 콜백 함수 결과', result)
            res.send({ user: result })
        }
    )(req, res, next)
}
// 구글 로그인




// 네이버 로그인


async function checkMe(req, res) {
    const { user } = res.locals;
    res.send({
      user:{
        nickname: user.nickname,
        email: user.email
      }
    });
  };


module.exports.kakaoCallback = kakaoCallback;
module.exports.checkMe = checkMe;