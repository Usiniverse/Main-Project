const {
  posts,
  Comments,
  Like,
  users,
  images,
  hosts,
  reviews,
  saves,
  sequelize,
  Sequelize,
} = require("../models");
const AWS = require("aws-sdk");
const Op = Sequelize.Op;
const { isTypedArray } = require("util/types");

// 유저 게시글 작성
async function WritePosting(req, res) {
  try {
    const { userId, nickname, userImageURL } = res.locals;
    const {
      title,
      content,
      mainAddress,
      subAddress,
      category,
      type,
      link,
      houseTitle,
      tagList,
      preImages, // 이미지보다 1개 적다, +1 해서 반복문 돌리기
    } = req.body;
    const image = req.files;
    // console.log(image);

    let islike = false;

    const PreImages = req.body.preImages.replace(/\s'/g, "");
    let preImagesArr = PreImages.replaceAll("'", "").split(",");
    let newContent = req.body.content;
    for (let i = 1; i < image.length; i++) {
      let preIMG = preImagesArr[i - 1];
      let ImGList = image[i].location;
      newContent = newContent.replaceAll(`${preIMG}`, `${ImGList}`);
    }

    const postInfo = await posts.create({
      userId,
      nickname,
      title,
      content: newContent,
      mainAddress,
      subAddress,
      category,
      type,
      link,
      houseTitle,
      commentNum: 0,
      likeNum: 0,
      islike: islike,
      tagList,
    });

    let newTagStr = "";
    if (req.body.tagList) {
      const newTag = req.body.tagList.split(" ");
      newTagStr += newTag;

      Object.assign(postInfo, {
        tagList: newTagStr.split(","),
      });
    }

    const postImageKey = image.map((postImageKey) => postImageKey.key);
    const postImageUrl = image.map((postImageUrl) => postImageUrl.location);
    const thumbnailKEY = postImageKey[0];
    const thumbnailURL = postImageUrl[0];

    if (image) {
      postImageKey.forEach((element, i) => {
        const postImageKEY = postImageKey[i];
        const postImageURL = postImageUrl[i];

        images.create({
          userId: userId,
          userImageURL: userImageURL,
          nickname: nickname,
          postId: postInfo.postId,
          thumbnailURL: thumbnailURL.toString(),
          thumbnailKEY: thumbnailKEY.toString(),
          postImageURL: postImageURL.toString(),
          postImageKEY: postImageKEY.toString(),
        });
      });
    }
    res.status(201).send({ postInfo, postImageUrl, thumbnailURL });
  } catch (e) {
    res.status(400).json({ errorMessage: "게시글이 등록되지 않았습니다." });
  }
}

// 유저 커뮤니티 게시글 전체 조회
async function GetPostingList(req, res) {
  let queryData = res.locals;
  if (queryData.userId === undefined) {
    queryData.userId = 0;
  }
  try {
    // Top 5 게시물
    let Top5 = await posts.findAll({
      include: [
        {
          model: images,
          required: true,
          attributes: ["postId", "thumbnailURL", "userImageURL"],
        },
        {
          model: users,
          attributes: ["nickname"],
        },
      ],
      order: [["likeNum", "DESC"]],
      limit: 5,
    });
    for (let j = 0; j < Top5.length; j++) {
      let tpost = Top5[j];
      const tpostComments = await Comments.findAll({
        where: { postId: tpost.postId },
      });

      const tpostLikes = await Like.findAll({
        where: { postId: tpost.postId },
      });

      let islike = await Like.findOne({
        where: { userId: queryData.userId, postId: tpost.postId },
      });

      const likeNum = tpostLikes.length;
      const commentNum = tpostComments.length;

      if (islike) {
        islike = true;
      } else {
        islike = false;
      }
      Object.assign(tpost, {
        islike: islike,
        commentNum: commentNum,
        likeNum: likeNum,
      });
      await posts.update(
        {
          islike: islike,
          likeNum: likeNum,
          commentNum: commentNum,
        },
        { where: { postId: tpost.postId } }
      );
    }

    let allPost = await posts.findAll({
      include: [
        {
          model: images,
          required: true,
          attributes: [
            "postId",
            "postImageURL",
            "thumbnailURL",
            "userImageURL",
          ],
        },
        {
          model: users,
          attributes: ["nickname"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    for (let i = 0; i < allPost.length; i++) {
      let post = allPost[i];
      const writtenTime = Date.parse(post.createdAt);
      const timeNow = Date.parse(Date());
      const diff = timeNow - writtenTime; // 경과 시간

      const times = [
        { time: "분", milliSeconds: 1000 * 60 },
        { time: "시간", milliSeconds: 1000 * 60 * 60 },
        { time: "일", milliSeconds: 1000 * 60 * 60 * 24 },
        { time: "주", milliSeconds: 1000 * 60 * 60 * 24 * 7 },
        { time: "달", milliSeconds: 1000 * 60 * 60 * 24 * 30 },
      ].reverse();
      const postComments = await Comments.findAll({
        where: { postId: post.postId },
      });

      const postLikes = await Like.findAll({
        where: { postId: post.postId },
      });

      let islike = await Like.findOne({
        where: { userId: queryData.userId, postId: post.postId },
      });

      const likeNum = postLikes.length;
      const commentNum = postComments.length;
      if (islike) {
        islike = true;
      } else {
        islike = false;
      }

      
        for (const value of times) {
          const betweenTime = Math.floor(diff / value.milliSeconds);
          if (betweenTime > 0) {
            post = {
              postId: post.postId,
              hostId: post.hostId,
              userId: post.userId,
              nickname: post.nickname,
              content: post.content,
              title: post.title,
              commentId: post.commentId,
              commentNum: commentNum,
              likeNum: likeNum,
              islike: islike,
              mainAddress: post.mainAddress,
              subAddress: post.subAddress,
              category: post.category,
              type: post.type,
              link: post.link,
              houseTitle: post.houseTitle,
              tagList: post.tagList,
              preImages: post.preImages,
              createdAt: betweenTime + value.time + "전",
              updatedAt: post.updatedAt,
              images: post.images,
              user: post.user,
            };
            allPost[i] = post;
            break;
          } else {
            post = {
              postId: post.postId,
              hostId: post.hostId,
              userId: post.userId,
              nickname: post.nickname,
              content: post.content,
              title: post.title,
              commentId: post.commentId,
              commentNum: commentNum,
              likeNum: likeNum,
              islike: islike,
              mainAddress: post.mainAddress,
              subAddress: post.subAddress,
              category: post.category,
              type: post.type,
              link: post.link,
              houseTitle: post.houseTitle,
              tagList: post.tagList,
              preImages: post.preImages,
              createdAt: "방금 전",
              updatedAt: post.updatedAt,
              images: post.images,
              user: post.user,
            };
            allPost[i] = post;
          }
        }
      
      await posts.update(
        { likeNum: likeNum, commentNum: commentNum },
        { where: { postId: post.postId } }
      );
    }
    res.status(200).send({ Top5, allPost });
    // console.log(allPost)
  } catch (err) {
    res.status(400).send({ msg: "포스트 전체조회에 실패했습니다." });
  }
}

// 유저 커뮤니티 게시글 상세 조회
async function GetPost(req, res) {
  try {
    const { postId } = req.params;
    let queryData = res.locals;

    if (queryData.userId === undefined) {
      queryData.userId = 0;
    }

    let allPostInfo = await posts.findOne({
      where: { postId },
      include: [
        {
          model: images,
          required: false,
          attributes: ["postImageKEY", "postImageURL"],
        },
        {
          model: Comments,
          required: false,
          attributes: ["postId", "comment"],
        },
        {
          model: Like,
          required: false,
          attributes: ["userId", "postId"],
        },
        {
          model: users,
          required: false,
          attributes: ["userImageURL", "nickname"],
        },
      ],
    });
    let newTagStr = "";
    if (allPostInfo.tagList.length) {
      const newTag = allPostInfo.tagList.split(" ");
      newTagStr += newTag;
    }
    const newTAG = newTagStr.split(",");
    let postComments = await Comments.findAll({
      where: { postId: allPostInfo.postId },
    });
    const postLikes = await Like.findAll({
      where: { postId: allPostInfo.postId },
    });

    let islike = await Like.findOne({
      where: { userId: queryData.userId, postId: allPostInfo.postId },
    });

    const likeNum = postLikes.length;
    const commentNum = postComments.length;

    if (islike) {
      islike = true;
    } else {
      islike = false;
    }
    const writtenTime = Date.parse(allPostInfo.createdAt);
    const timeNow = Date.parse(Date());
    const diff = timeNow - writtenTime;
   await posts.update(
      {
        likeNum: likeNum,
        commentNum: commentNum,
        islike: islike,
      },
      { where: { postId: allPostInfo.postId } }
    );
    let allPost = [];
    
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
         
          allPost = [{
            postId: allPostInfo.postId,
            userId: allPostInfo.userId,
            nickname: allPostInfo.user.nickname,
            userImageURL: allPostInfo.user.userImageURL,
            content: allPostInfo.content,
            title: allPostInfo.title,
            commentId: allPostInfo.commentId,
            commentNum: commentNum,
            likeNum: likeNum,
            islike: islike,
            mainAddress: allPostInfo.mainAddress,
            subAddress: allPostInfo.subAddress,
            category: allPostInfo.category,
            type: allPostInfo.type,
            link: allPostInfo.link,
            houseTitle: allPostInfo.houseTitle,
            tagList: newTAG,
            createdAt: betweenTime + value.time + "전",
            updatedAt: allPostInfo.updatedAt,
            images: allPostInfo.images,
          }]
          break;
        }else {
         allPost =[{
           postId: allPostInfo.postId,
           userId: allPostInfo.userId,
           nickname: allPostInfo.user.nickname,
           userImageURL: allPostInfo.user.userImageURL,
           content: allPostInfo.content,
           title: allPostInfo.title,
           commentId: allPostInfo.commentId,
           commentNum: commentNum,
           likeNum: likeNum,
           islike: islike,
           mainAddress: allPostInfo.mainAddress,
           subAddress: allPostInfo.subAddress,
           category: allPostInfo.category,
           type: allPostInfo.type,
           link: allPostInfo.link,
           houseTitle: allPostInfo.houseTitle,
           tagList: newTAG,
           createdAt: "방금 전",
           updatedAt: allPostInfo.updatedAt,
           images: allPostInfo.images,
         }]
        }
      }
    
    // console.log(allPost, '올포스트 나오나?')
    //글쓴이의 다른 게시물

    const outherPosts = await posts.findAll({
      where: {
        userId: allPostInfo.userId,
        postId: {
          [Op.ne]: postId,
        },
      },
      order: [["commentNum", "DESC"]],
      limit: 3,
      include: [
        {
          model: images,
          attributes: [
            "postId",
            "postImageURL",
            "thumbnailURL",
            "userImageURL",
          ],
        },
        {
          model: users,
          attributes: ["nickname"],
        },
      ],
    });

    for (let i = 0; outherPosts.length > i; i++) {
      const outherPost = outherPosts[i];
      const outherPostComments = await Comments.findAll({
        where: { postId: outherPost.postId },
      });
      const outherPostLikes = await Like.findAll({
        where: { postId: outherPost.postId },
      });

      let islike = await Like.findOne({
        where: { userId: queryData.userId, postId: outherPost.postId },
      });

      const likeNum = outherPostLikes.length;
      const commentNum = outherPostComments.length;

      if (islike) {
        islike = true;
      } else {
        islike = false;
      }

      await posts.update(
        {
          likeNum: likeNum,
          commentNum: commentNum,
          islike: islike,
        },
        { where: { postId: allPostInfo.postId } }
      );

      Object.defineProperties(outherPost.dataValues, {
        title: {
          enumerable: true,
        },
        content: {
          enumerable: false,
        },
        hostId: {
          enumerable: false,
        },
        commentId: {
          enumerable: false,
        },
        commentNum: { value: commentNum, enumerable: true },
        likeNum: { value: likeNum, enumerable: true },
        islike: { value: islike, enumerable: true },
        mainAddress: {
          enumerable: false,
        },
        subAddress: {
          enumerable: false,
        },
        category: {
          enumerable: false,
        },
        type: {
          enumerable: false,
        },
        link: {
          enumerable: false,
        },
        houseTitle: {
          enumerable: false,
        },
        tagList: {
          enumerable: false,
        },
        createdAt: {
          enumerable: false,
        },
        updatedAt: {
          enumerable: false,
        },
      });
    }

    const outherPostInfo = outherPosts.map((outherpostinfo) => ({
      postId: outherpostinfo.postId,
      userId: outherpostinfo.userId,
      nickname: outherpostinfo.user.nickname,
      title: outherpostinfo.title,
      commentNum: outherpostinfo.commentNum,
      likeNum: outherpostinfo.likeNum,
      islike: outherpostinfo.islike,
      preImages: outherpostinfo.preImages,
      images: outherpostinfo.images,
    }));

    // 이 글에 나온 숙소 찾아오기
    let findHostId = await hosts.findAll({
      attributes: ["title", "hostId"],
    });

    let houseTitle = [];
    for (let i = 0; i < findHostId.length; i++) {
      let house = findHostId[i];
      houseTitle.push(house.title);

      let isSave = await saves.findOne({
        where: { hostId: house.hostId, userId: queryData.userId },
      });
      if (isSave) {
        isSave = true;
      } else {
        isSave = false;
      }
      Object.assign(house, {
        isSave: isSave,
      });
      await hosts.update(
        { isSave: isSave },
        { where: { hostId: house.hostId } }
      );
    }

    let findAllAcc = [];
    if (houseTitle.indexOf(allPostInfo.houseTitle) != -1) {
      let findAllAcc = await hosts.findAll({
        where: { title: allPostInfo.houseTitle },
        attritutes: ["hostId"],
        include: [
          {
            model: images,
            required: false,
            attributes: ["postImageURL", "thumbnailURL"],
          },
        ],
      });

      const findStar = await reviews.findAll({
        where: { hostId: findAllAcc[0].hostId },
        attributes: ["starpoint"],
      });

      starsum = [];
      for (let i = 0; findStar.length > i; i++) {
        const star = findStar[i];
        starsum.push(star.dataValues.starpoint);
      }

      if (findStar.length) {
        const numStar = findStar.length;
        let averageStarpoint = starsum.reduce((a, b) => a + b) / numStar;

        Object.assign(findAllAcc[0], {
          average: averageStarpoint,
        });

        await hosts.update(
          { average: averageStarpoint },
          { where: { hostId: findAllAcc[0].hostId } }
        );
      }
      
      res.status(200).send({allPost,findAllAcc, outherPostInfo });
      
    } else {
      
      res.status(200).send({ allPost, findAllAcc, outherPostInfo });
    }
  } catch (err) {
    res.status(400).send({ msg: "포스트 상세조회에 실패했습니다." });
  }
}

// 유저 커뮤니티 게시글 수정
async function ModifyPosting(req, res) {
  try {
    const { userId, userImageURL, nickname } = res.locals;
    const { postId } = req.params;
    const {
      title,
      content,
      mainAddress,
      subAddress,
      category,
      type,
      link,
      houseTitle,
      tagList,
      preImages,
      deleteImages, // 키값 형태: 배열(길이 - KEY : 47 / URL : 62)
      changeThumbnail,
    } = req.body;
    const image = req.files; // 4장

    // 키 값은 S3 삭제, URL은 DB 삭제
    const deleteinfo = req.body.deleteImages.replace(/\s'/g, "");
    const deleteinfo2 = deleteinfo.replaceAll(" ", "");
    const deleteinfo3 = deleteinfo2.replaceAll("postImageURL:", "");
    const deleteinfo4 = deleteinfo3.replaceAll("postImageKEY:", "");
    const deleteInfo = deleteinfo4.replaceAll("'", "").split(",");
    // deleteImages 배열화
    let deleteKEY = [];
    let deleteURL = [];
    for (let i = 0; i < deleteInfo.length / 2; i++) {
      if (i < 0) {
        deleteInfo[0] = deleteInfo[1];
      } else {
        let deleteKey = deleteInfo[i * 2 + 1];
        let deleteUrl = deleteInfo[i * 2];
        deleteKEY.push(deleteKey);
        deleteURL.push(deleteUrl);
      }
    }

    // 썸네일을 위해 삭제되기 전에 DB에서 미리 찾아둠
    const getThumnailInfo = await images.findAll({
      where: { postId: postId },
      attributes: [
        "thumbnailURL",
        "thumbnailKEY",
        "postImageKEY",
        "postImageURL",
      ],
    });
    let imagesInfoURL = [];
    let imagesInfoKEY = [];
    for (let i = 0; i < getThumnailInfo.length; i++) {
      let getThumnailInfoKEY = getThumnailInfo[i].postImageKEY;
      let getThumnailInfoURL = getThumnailInfo[i].postImageURL;
      imagesInfoKEY.push(getThumnailInfoKEY);
      imagesInfoURL.push(getThumnailInfoURL);
    }

    // 이미지 파일객체 map
    const postImagesKEY = image.map((postImageKey) => postImageKey.key);
    const postImagesURL = image.map((postImageUrl) => postImageUrl.location);

    // DB 삭제
    const destroyKEY = await images.findAll({
      where: { postId },
      attributes: ["postImageKEY", "postImageURL"],
    });
    let imagesDestroyKEY = [];
    let imagesDestroyURL = [];
    for (let i = 0; i < destroyKEY.length; i++) {
      let imagesDestroyKey = destroyKEY[i].postImageKEY;
      let imagesDestroyUrl = destroyKEY[i].postImageURL;
      imagesDestroyKEY.push(imagesDestroyKey);
      imagesDestroyURL.push(imagesDestroyUrl);
    }

    if (deleteImages) {
      // AWS S3 삭제 코드
      const s3 = new AWS.S3();
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
          Objects: deleteKEY.map((deleteKEY) => ({ Key: deleteKEY })),
        },
      };
      s3.deleteObjects(params, function (err, data) {
        if (err) console.log(err, err.stack); // error
        else {
          console.log("S3에서 삭제되었습니다"), data;
        } // deleted
      });
    }

    const destroyImages = await images.destroy({
      where: { postImageURL: deleteURL },
    });
    console.log(destroyImages, "이것만 삭제한다");

    let newContent = req.body.content;
    // 상황 1. 사진이 추가되고 썸네일 수정 있음, 이미지의 0번째는 썸네일
    if (changeThumbnail === "true") {
      // content 중 blob 값을 대체
      const PreImage = req.body.preImages.replace(/\s'/g, "");
      let preImagesArr = PreImage.replaceAll("'", "").split(",");
      console.log(preImagesArr, "이게 바뀌어야 함");
      for (let i = 1; i < image.length; i++) {
        let preIMG = preImagesArr[i - 1];
        console.log(preIMG, "이미지 대체하기");
        let ImGList = image[i].location;
        newContent = newContent.replaceAll(`${preIMG}`, `${ImGList}`);
      }

      const thumnailUrl = image[0].location;
      const thumnailKey = image[0].key;
      postImagesKEY.forEach((element, i) => {
        const postImageKEY = postImagesKEY[i];
        const postImageURL = postImagesURL[i];

        images.create({
          userId: userId,
          userImageURL: userImageURL,
          nickname: nickname,
          postId: postId,
          thumbnailURL: thumnailUrl,
          thumbnailKEY: thumnailKey,
          postImageURL: postImageURL.toString(),
          postImageKEY: postImageKEY.toString(),
        });
      });

      await images.update(
        {
          thumbnailURL: thumnailUrl,
          thumbnailKEY: thumnailKey,
        },
        {
          where: { postId: postId },
        }
      );
    }

    // 상황 2. 사진이 추가되고 썸네일 수정 없음
    if (changeThumbnail === "false") {
      // content 중 blob 값을 대체
      const PreImage = req.body.preImages.replace(/\s'/g, "");
      let preImagesArr = PreImage.replaceAll("'", "").split(",");
      for (let i = 0; i < image.length; i++) {
        let preIMG = preImagesArr[i];
        let ImGList = image[i].location;
        newContent = newContent.replaceAll(`${preIMG}`, `${ImGList}`);
      }

      postImagesKEY.forEach((element, i) => {
        const postImageKEY = postImagesKEY[i];
        const postImageURL = postImagesURL[i];
        images.create({
          userId: userId,
          userImageURL: userImageURL,
          nickname: nickname,
          postId: postId,
          thumbnailURL: imagesInfoURL[0],
          thumbnailKEY: imagesInfoKEY[0],
          postImageURL: postImageURL.toString(),
          postImageKEY: postImageKEY.toString(),
        });
      });
    }

    await posts.update(
      {
        userId: userId,
        nickname: nickname,
        title: title,
        content: newContent,
        mainAddress: mainAddress,
        subAddress: subAddress,
        category: category,
        type: type,
        link: link,
        houseTitle: houseTitle,
        tagList,
      },
      {
        where: { postId: postId },
      }
    );

    const postInfo = await posts.findAll({
      where: { postId: postId },
      include: [
        {
          model: images,
          attributes: ["postImageURL", "thumbnailURL"],
        },
      ],
    });

    let newTagStr = "";
    if (req.body.tagList) {
      const newTag = req.body.tagList.split(" ");
      newTagStr += newTag;

      Object.assign(postInfo, {
        tagList: newTagStr.split(","),
      });
    }

    res.status(200).send({ postInfo });
  } catch {
    res.status(400).send({ msg: "포스트 수정에 실패했습니다." });
  }
}

// 유저 커뮤니티 게시글 삭제
async function DeletePost(req, res) {
  try {
    const { postId } = req.params;
    console.log(postId);

    const postImageInfo = await images.findAll({
      where: { postId },
    });

    const postImageKey = postImageInfo.map(
      (postImageKey) => postImageKey.postImageKEY
    );

    postImageKey.forEach((element, i) => {
      const postImageKEY = postImageKey[i];

      if (postId) {
        const s3 = new AWS.S3();
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: {
            Objects: postImageKey.map((postImageKEY) => ({
              Key: postImageKEY,
            })),
          },
        };
        s3.deleteObjects(params, function (err, data) {
          if (err) console.log(err, err.stack);
          else {
            console.log("S3에서 삭제되었습니다"), data;
          }
        });
      }
    });

    await Like.destroy({ where: { postId } });
    await Comments.destroy({ where: { postId } });
    await images.destroy({ where: { postId } });
    await posts.destroy({ where: { postId } });

    res.status(200).send({ postImageInfo, msg: "게시글이 삭제되었습니다!" });
  } catch (err) {
    res.status(400).send({ postImageInfo, msg: "게시글 삭제실패!" });
  }
}

module.exports = {
  WritePosting,
  GetPostingList,
  GetPost,
  ModifyPosting,
  DeletePost,
};
