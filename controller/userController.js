require("dotenv").config();

const jwt = require("jsonwebtoken");
const passport = require("passport");
const {
  images,
  posts,
  users,
  hosts,
  Like,
  saves,
  sequelize,
  Sequelize,
} = require("../models");
const axios = require("axios");
const { cache } = require("ejs");

//카카오 로그인
const kakaoCallback = (req, res, next) => {
  try {
    passport.authenticate(
      "kakao",

      { failureRedirect: "/" },
      (err, users, images, info) => {
        console.log("여기가 문제가 발생하나요?(여긴 콜백함수입니다!)");
        if (err) return next(err);
        //----------------------------------------------------------------

        const { userImageURL } = images;
        const { userId, nickname, host, email } = users;
        const token = jwt.sign({ userId }, process.env.MY_KEY, {
          expiresIn: "24h",
        });

        result = {
          userId,
          token,
          nickname,
          userImageURL,
          host,
          email,
        };
        // res.redirect(`https://mendorong-jeju.co.kr=${token}`);
        res.send({ users: result });
      }
    )(req, res, next);
  } catch (error) {
    res.status(400).send({ errorMessage: "카카오 로그인 실패" });
  }
};

// 구글 로그인

const googleCallback = (req, res, next) => {
  try {
    passport.authenticate(
      "google",
      { failureRedirect: "/" },
      (err, users, images, info) => {
        if (err) return next(err);

        const { userImageURL } = images;
        const { userId, nickname, host, email } = users;
        const token = jwt.sign({ userId }, process.env.MY_KEY, {
          expiresIn: "24h",
        });

        result = {
          userId,
          token,
          nickname,
          userImageURL,
          host,
          email,
        };

        res.send({ users: result });
      }
    )(req, res, next);
  } catch (error) {
    res.status(400).send({ errorMessage: "구글 로그인 실패" });
  }
};

// 네이버 로그인

const naverCallback = (req, res, next) => {
  try {
    passport.authenticate(
      "naver",
      { failureRedirect: "/" },
      (err, users, images, info) => {
        if (err) return next(err);

        const { userImageURL } = images;
        const { userId, nickname, host, email } = users;
        const token = jwt.sign({ userId }, process.env.MY_KEY, {
          expiresIn: "24h",
        });

        result = {
          userId,
          token,
          nickname,
          userImageURL,
          host,
          email,
        };

        res.send({ users: result });
      }
    )(req, res, next);
  } catch (error) {
    res.status(400).send({ errorMessage: "네이버 로그인 실패" });
  }
};

//로그인 인증
async function checkMe(req, res) {
  const { userId, nickname, userImageURL, email, host } = res.locals;
  try {
    res.send({
      success: true,
      email,
      userId,
      nickname,
      userImageURL,
      host,
    });
  } catch (error) {
    res.status(400).send({ errorMessage: "로그인 인증실패" });
  }
}

//마이페이지 정보 - 1
async function Mypage(req, res) {
  const { userId } = res.locals;

  try {
    const mysavelist = await saves.findAll({
      where: { userId },
    });
    // 저장한 게시물
    const mysavehost = [];
    const mysaveinfo = mysavelist.map((saveinfo) => saveinfo.hostId);

    for (let i = 0; mysaveinfo.length > i; i++) {
      const savehost = await hosts.findOne({
        where: { hostId: mysaveinfo[i] },
        include: [
          {
            model: images,
            attributes: ["hostId", "thumbnailURL"],
          },
        ],
      });
      const mysavehostlist = {
        hostId: savehost.hostId,
        title: savehost.title,
        average: savehost.average,
        images: savehost.images,
      };

      mysavehost.push(mysavehostlist);
    }

    // 좋아요 누른 게시물
    const mylikelist = await Like.findAll({
      where: { userId },
    });

    const mylikespost = [];
    const mylikeinfo = mylikelist.map((likeinfo) => likeinfo.postId);

    for (let i = 0; mylikeinfo.length > i; i++) {
      const likepost = await posts.findOne({
        where: { postId: mylikeinfo[i] },
        include: [
          {
            model: images,
            attributes: ["postId", "thumbnailURL"],
          },
        ],
      });

      const mylikepostlist = {
        postId: likepost.postId,
        title: likepost.title,
        commentNum: likepost.commentNum,
        likeNum: likepost.likeNum,
        images: likepost.images,
      };

      mylikespost.push(mylikepostlist);
    }

    // 내가 쓴 게시물
    const mypostlist = await posts.findAll({
      where: { userId },
      include: [
        {
          model: images,
          attributes: ["postId", "thumbnailURL"],
        },
      ],
    });

    const mypostinfo = mypostlist.map((postinfo) => ({
      postId: postinfo.postId,
      title: postinfo.title,
      commentNum: postinfo.commentNum,
      likeNum: postinfo.likeNum,
      images: postinfo.images,
    }));

    // 호스트 게시물
    const hostpost = await hosts.findAll({
      where: { userId },
      include: [
        {
          model: images,
          attributes: ["hostId", "thumbnailURL"],
        },
      ],
    });

    const hostinfo = hostpost.map((hosts) => ({
      hostId: hosts.hostId,
      title: hosts.title,
      average: hosts.average,
      images: hosts.images,
    }));

    res.status(200).json({
      mypostinfo,
      mylikespost,
      hostinfo,
      mysavehost,
    });
  } catch (error) {
    res.status(400).send({ errorMessage: "마이페이지 오류" });
  }
}

// 마이페이지 정보 수정

async function MypagePutname(req, res) {
  try {
    const userId = res.locals.userId;
    const { nickname } = req.body;

    const existnicName = await users.findOne({ where: { nickname } });

    if (existnicName) {
      return res
        .status(400)
        .send({ result: false, errorMessage: "중복된 닉네임 사용중입니다." });
    } else {
      await users.update({ nickname }, { where: { userId } });
      res.status(200).send({ nickname, result: true, message: "수정 완료" });
    }
  } catch (error) {
    res.status(400).send({ result: false, errorMessage: "닉네임 수정 실패." });
  }
}

//프로필이미지 수정하기
async function MypagePutImage(req, res) {
  try {
    const image = req.files;
    const userId = res.locals.userId;
    const userImageKEY = image.map((userImageKEY) => userImageKEY.key);
    const userImageURL = image.map((userImageURL) => userImageURL.location);

    const existImage = await images.findOne({ where: { userId } });
    if (existImage) {
      const userImages = await images.update(
        {
          userImageKEY: userImageKEY.toString(),
          userImageURL: userImageURL.toString(),
        },
        { where: { userId } }
      );
      const usersImages = await users.update(
        { userImageURL: userImageURL.toString() },
        { where: { userId } }
      );
      res
        .status(200)
        .send({
          userImages,
          userImageKEY,
          userImageURL,
          usersImages,
          msg: "성공",
        });
    }
  } catch (error) {
    res
      .status(400)
      .send({ result: false, errorMessage: "프로필사진 업데이트 실패" });
  }
}

// 사업자등록번호 검증

async function CNU_CK(req, res, next) {
  const CNU = req.body.CNU; //사업자 등록번호

  var data = {
    b_no: [CNU], // 사업자번호 "xxxxxxx" 로 조회 시,
  };
  const CNU_CK = await postCRN(CNU);

  // Company Number check
  async function postCRN(crn) {
    try {
      const postUrl =
        "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=hsmMPV8Yvh7MAswqXiCCcM%2BlWTuetywv5slb0C2xYqLlwk1Qrqp%2BbChwrRIEvBHmVzPxy%2BR9%2FYcZ08ZUa65rHQ%3D%3D";

      const result = await axios
        .post(postUrl, JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        })
        .then((res) => {
          return res.data.data[0].tax_type;
        })
        .catch((err) => {});

      if (result !== "국세청에 등록되지 않은 사업자등록번호입니다.") {
        const userId = res.locals.userId;
        await users.update({ host: true }, { where: { userId } });
        res
          .status(200)
          .send({
            result: true,
            message: "멘도롱 제주의 호스트가 되셨습니다.",
          });
      } else {
        res
          .status(400)
          .send({
            result: true,
            message: "국세청에 등록되지 않은 사업자등록번호입니다.",
          });
      }
    } catch (error) {
      console.error(error);
      res.status(400).send({
        errorMEssage: "국세청에 등록되지 않은 사업자등록번호입니다.",
      });
      return;
    }
  }
  next();
}

//다른 유저 정보 보기

async function otherUser(req, res) {
  const { userId } = req.params;

  try {
    const otherPostuser = await users.findOne({
      where: { userId: userId },
      include: [
        {
          model: images,
          attributes: ["userImageURL"],
        },
      ],
    });
    // console.log(otherPostuser, '이거 나오는데');

    const otherpost = await posts.findAll({
      where: { userId: userId },
      include: [
        {
          model: images,
          attributes: ["postId", "thumbnailURL"],
        },
      ],
    });
    // console.log(otherpost, '이거 나오는데22');

    const otherinfo = otherpost.map((o_post) => ({
      title: o_post.title,
      commentNum: o_post.commentNum,
      likeNum: o_post.likeNum,
      images: o_post.images,
    }));
    console.log(otherinfo);

    res.status(200).json({
      otherinfo,
      userImageURL: otherPostuser.userImageURL,
      nickname: otherPostuser.nickname,
    });
  } catch (error) {
    res
      .status(400)
      .send({
        otherinfo,
        errorMEssage: "다른 유저의 정보를 가지고 올수 없습니다.",
      });
  }
}

module.exports = {
  kakaoCallback,
  googleCallback,
  naverCallback,
  checkMe,
  Mypage,
  MypagePutname,
  CNU_CK,
  MypagePutImage,
  otherUser,
};
