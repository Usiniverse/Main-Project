const {
  images,
  hosts,
  reviews,
  saves,
  sequelize,
  Sequelize,
} = require("../models");
const AWS = require("aws-sdk");
const { Op } = require("sequelize");

// 호스트 숙소 게시글 작성
async function hostCreateAcc(req, res) {
  const { userId, nickname, userImageURL } = res.locals;
  const host = res.locals.host;

  try {
    if (host != true) {
      res.send({ errorMessage: "호스트가 아닙니다!" });
    }
    const {
      title,
      category,
      houseInfo,
      mainAddress,
      subAddress,
      stepSelect,
      stepInfo,
      link,
      hostContent,
      tagList,
    } = req.body;
    const image = req.files;

    let tagListArr = [];
    if (req.body.tagList) {
      let tagListArray = tagList.split(" ");
      tagListArr.push(tagListArray);
    }
    //tagListArr를 string으로 관리할 건지 array로 관리할건지 결정 후 db형식을 일치화
    const createAcc = await hosts.create({
      userId,
      title,
      category,
      houseInfo,
      mainAddress,
      subAddress,
      stepSelect,
      stepInfo,
      link,
      hostContent,
      tagList: tagListArr.toString(),
      isSave: false,
      average: 0,
    });

    if (image) {
      // S3 이미지 등록 및 images DB 저장
      const postImageKey = image.map((postImageKey) => postImageKey.key);
      const postImageUrl = image.map((postImageUrl) => postImageUrl.location);
      const thumbnailKEY = postImageKey[0];
      const thumbnailURL = postImageUrl[0];

      postImageKey.forEach((element, i) => {
        const postImageKEY = postImageKey[i];
        const postImageURL = postImageUrl[i];
        console.log(postImageKEY);
        console.log(postImageURL);

        const imagesInfo = images.create({
          userId: userId,
          nickname: nickname,
          hostId: createAcc.hostId,
          thumbnailURL: thumbnailURL.toString(),
          thumbnailKEY: thumbnailKEY.toString(),
          postImageURL: postImageURL,
          postImageKEY: postImageKEY,
          userImageURL: userImageURL,
        });
      });

      const findAcc = await hosts.findAll({
        where: { hostId: createAcc.hostId },
      });

      if (req.body.tagList) {
        const tagListArr = tagList.split(" ");

        Object.assign(findAcc[0], {
          tagList: tagListArr,
        });
      }

      res
        .status(201)
        .send({ findAcc, postImageUrl, msg: "숙소 등록이 완료되었습니다!" });
    }
  } catch (error) {
    res.status(400).send({ errorMessage: "호스트 숙소 게시글 작성 실패" });
  }
}

//호스트 숙소 검색하기
async function hostAddresssearch(req, res) {
  const queryData = req.query;
  let key = {};
  try {
    queryData.search === "Northarea"
      ? (key = {
          [Op.or]: [
            {
              mainAddress: {
                [Op.substring]: "제주시",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "조천읍",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "애월읍",
              },
            },
          ],
        })
      : queryData.search === "Westarea"
      ? (key = {
          [Op.or]: [
            {
              mainAddress: {
                [Op.substring]: "한림읍",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "한경면",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "대정읍",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "안덕면",
              },
            },
          ],
        })
      : queryData.search === "Southarea"
      ? (key = {
          [Op.or]: [
            {
              mainAddress: {
                [Op.substring]: "중문",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "서귀포시",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "남원읍",
              },
            },
          ],
        })
      : queryData.search === "Eastarea"
      ? (key = {
          [Op.or]: [
            {
              mainAddress: {
                [Op.substring]: "구좌읍",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "성산읍",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "표선면",
              },
            },
            {
              mainAddress: {
                [Op.substring]: "우도면",
              },
            },
          ],
        })
      : (key = {});

    const hostPost = await hosts.findAll({
      where: key,
      include: [
        {
          model: images,
          attributes: ["hostId", "postImageURL"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).send({ msg: "숙소검색 완료", hostPost });
  } catch (error) {
    res.status(400).send({ errorMessage: "호스트 숙소 게시글 작성 실패" });
  }
}

// 호스트 숙소 게시글 전체 조회 - 별점순
async function getAllACC_Star(req, res) {
  let queryData = res.locals;
  if (queryData.userId === undefined) {
    queryData.userId = 0;
  }

  try {
    const findAllAcc = await hosts.findAll({
      include: [
        {
          model: images,
          attributes: ["hostID", "postImageURL"],
        },
      ],
      order: [["average", "DESC"]],
    });
    for (let j = 0; findAllAcc.length > j; j++) {
      const hoststar = findAllAcc[j];

      const findStar = await reviews.findAll({
        where: { hostId: hoststar.hostId },
        attributes: ["starpoint"],
      });

      // 별점 평균 for 문
      starsum = [];

      for (let i = 0; findStar.length > i; i++) {
        const star = findStar[i];

        starsum.push(star.dataValues.starpoint);
      }
      let isSave = await saves.findOne({
        where: { hostId: hoststar.hostId, userId: queryData.userId },
      });

      if (isSave) {
        isSave = true;
      } else {
        isSave = false;
      }

      let averageStarpoint = 0;

      if (findStar.length) {
        const numStar = findStar.length;
        averageStarpoint = starsum.reduce((a, b) => a + b) / numStar;
      }

      Object.assign(hoststar, {
        average: averageStarpoint,
        isSave: isSave,
      });

      await hosts.update(
        { average: averageStarpoint, isSave: isSave },
        { where: { hostId: hoststar.hostId } }
      );

      averageStarpoint = String(averageStarpoint);
    }
    res.status(200).send({ findAllAcc });
  } catch (error) {
    res
      .status(400)
      .send({ msg: "호스트 숙소 게시글 전체 조회를 하지 못했습니다" });
  }
}

// 호스트 숙소 게시글 전체 조회
async function getAllAcc(req, res) {
  let queryData = res.locals;
  if (queryData.userId === undefined) {
    queryData.userId = 0;
  }

  try {
    const findAllAcc = await hosts.findAll({
      include: [
        {
          model: images,
          attributes: ["hostId", "postImageURL"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    for (let j = 0; findAllAcc.length > j; j++) {
      const hoststar = findAllAcc[j];

      const findStar = await reviews.findAll({
        where: { hostId: hoststar.hostId },
        attributes: ["starpoint"],
      });

      // 별점 평균 for 문
      starsum = [];

      for (let i = 0; findStar.length > i; i++) {
        const star = findStar[i];

        starsum.push(star.dataValues.starpoint);
      }
      let isSave = await saves.findOne({
        where: { hostId: hoststar.hostId, userId: queryData.userId },
      });

      if (isSave) {
        isSave = true;
      } else {
        isSave = false;
      }

      let averageStarpoint = 0;

      if (findStar.length) {
        const numStar = findStar.length;
        averageStarpoint = starsum.reduce((a, b) => a + b) / numStar;
      }
      Object.assign(hoststar, {
        average: averageStarpoint,
        isSave: isSave,
      });
      await hosts.update(
        { average: averageStarpoint, isSave: isSave },
        { where: { hostId: hoststar.hostId } }
      );
      averageStarpoint = String(averageStarpoint);
    }
    res.status(200).send({ findAllAcc });
  } catch (error) {
    res.status(400).send({ errorMessage: "호스트 숙소 게시글 전체 조회 실패" });
  }
}

// 호스트 숙소 게시글 상세 조회
async function getDetailAcc(req, res) {
  const { hostId } = req.params;
  let queryData = res.locals;

  if (queryData.userId === undefined) {
    queryData.userId = 0;
  }

  try {
    let findAllAcc = await hosts.findOne({
      where: { hostId },
      include: [
        {
          model: images,
          required: true,
          attributes: ["postImageURL", "postImageKEY"],
        },
      ],
    });
    const writtenTime = Date.parse(findAllAcc.createdAt);
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
          findAllAcc = {
            hostId: findAllAcc.hostId,
            userId: findAllAcc.userId,
            reviewId: findAllAcc.reviewId,
            average: findAllAcc.average,
            title: findAllAcc.title,
            isSave: findAllAcc.isSave,
            nickname: findAllAcc.nickname,
            category: findAllAcc.category,
            houseInfo: findAllAcc.houseInfo,
            mainAddress: findAllAcc.mainAddress,
            subAddress: findAllAcc.subAddress,
            stepSelect: findAllAcc.stepSelect,
            stepInfo: findAllAcc.stepInfo,
            link: findAllAcc.link,
            hostContent: findAllAcc.hostContent,
            preImages: findAllAcc.preImages,
            tagList: findAllAcc.tagList,
            createdAt: betweenTime + value.time + "전",
            updatedAt: findAllAcc.updatedAt,
            images: findAllAcc.images,
          };
          break;
        } else {
          findAllAcc = {
            hostId: findAllAcc.hostId,
            userId: findAllAcc.userId,
            reviewId: findAllAcc.reviewId,
            average: findAllAcc.average,
            title: findAllAcc.title,
            isSave: findAllAcc.isSave,
            nickname: findAllAcc.nickname,
            category: findAllAcc.category,
            houseInfo: findAllAcc.houseInfo,
            mainAddress: findAllAcc.mainAddress,
            subAddress: findAllAcc.subAddress,
            stepSelect: findAllAcc.stepSelect,
            stepInfo: findAllAcc.stepInfo,
            link: findAllAcc.link,
            hostContent: findAllAcc.hostContent,
            preImages: findAllAcc.preImages,
            tagList: findAllAcc.tagList,
            createdAt: "방금 전",
            updatedAt: findAllAcc.updatedAt,
            images: findAllAcc.images,
          };
        }
      }
    

    let isSave = await saves.findOne({
      where: { hostId: hostId, userId: queryData.userId },
    });

    if (isSave) {
      isSave = true;
    } else {
      isSave = false;
    }

    const findStar = await reviews.findAll({
      where: { hostId },
      attributes: ["starpoint"],
    });

    starsum = [];
    for (let i = 0; findStar.length > i; i++) {
      const star = findStar[i];
      starsum.push(star.dataValues.starpoint);
    }

    console.log(findAllAcc.tagList);
    if (findAllAcc.tagList) {
      const tagListArr = findAllAcc.tagList.split(",");
      Object.assign(findAllAcc, {
        tagList: tagListArr,
      });
    }

    if (findStar.length) {
      const numStar = findStar.length;
      let averageStarpoint = starsum.reduce((a, b) => a + b) / numStar;

      Object.assign(findAllAcc, {
        average: averageStarpoint,
        isSave: isSave,
      });

      await hosts.update(
        { average: averageStarpoint, isSave: isSave },
        { where: { hostId: findAllAcc.hostId } }
      );
    } else {
      Object.assign(findAllAcc, {
        isSave: isSave,
      });
    }

    res.status(200).send({ findAllAcc });
  } catch (error) {
    res.status(400).send({ errorMessage: "호스트 숙소 상세 조회 실패" });
  }
}

// 호스트 숙소 게시글 삭제
async function deleteAcc(req, res) {
  const { userId } = res.locals;
  const { hostId } = req.params;

  try {
    const findAcc = await hosts.findOne({ where: { hostId } });
    if (userId !== findAcc.userId) {
      res.send({ errorMessage: "작성자가 아닙니다!" });
    }

    const postImageInfo = await images.findAll({
      where: { hostId },
    });

    const postImageKey = postImageInfo.map(
      (postImageKey) => postImageKey.postImageKEY
    );

    postImageKey.forEach((element, i) => {
      const postImageKEY = postImageKey[i];

      if (hostId) {
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

    await hosts.destroy({ where: { hostId } });
    await images.destroy({ where: { hostId } });

    res.status(200).send({ msg: "게시글이 삭제되었습니다!" });
  } catch (error) {
    res.status(400).send({ errorMessage: "게시글 삭제 실패" });
  }
}

//호스트 타입 검색
async function hostTypesearch(req, res) {
  const querydata = req.query;
  try {
    const housebyType = await hosts.findAll({
      where: { houseInfo: querydata.search },
      include: [
        {
          model: images,
          required: false,
          attributes: [
            "hostId",
            "postImageURL",
            "thumbnailURL",
            "userImageURL",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).send({ housebyType, msg: "타입 검색이 완료되었습니다." });
  } catch (err) {
    res.status(400).send({ msg: "타입 검색을 하지 못하였습니다." });
  }
}

//호스트 검색
async function hostsearch(req, res) {
  let searchResult = [];
  let searchResultId = [];
  const querydata = req.query;

  try {
    const findbyaddress = await hosts.findAll({
      where: {
        [Op.or]: [
          {
            mainAddress: {
              [Op.substring]: querydata.search,
            },
          },
          { houseInfo: querydata.search },
        ],
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: images,
          required: false,
          attributes: [
            "hostId",
            "postImageURL",
            "thumbnailURL",
            "userImageURL",
          ],
        },
      ],
    });
    const findbytitle = await hosts.findAll({
      where: {
        title: {
          [Op.substring]: querydata.search,
        },
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: images,
          required: false,
          attributes: [
            "hostId",
            "postImageURL",
            "thumbnailURL",
            "userImageURL",
          ],
        },
      ],
    });
    let hostContent = await hosts.findAll({
      where: {
        hostContent: {
          [Op.substring]: querydata.search,
        },
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: images,
          required: false,
          attributes: [
            "hostId",
            "postImageURL",
            "thumbnailURL",
            "userImageURL",
          ],
        },
      ],
    });
    for (let h = 0; h < findbyaddress.length; h++) {
      searchResult.push(findbyaddress[h]);
      searchResultId.push(findbyaddress[h].hostId);
    }
    for (let p = 0; p < findbytitle.length; p++) {
      if (searchResultId.includes(findbytitle[p].hostId)) {
      } else {
        searchResult.push(findbytitle[p]);
        searchResultId.push(findbytitle[p].hostId);
      }
    }
    for (let i = 0; i < hostContent.length; i++) {
      if (searchResultId.includes(hostContent[i].hostId)) {
      } else {
        searchResult.push(hostContent[i]);
        searchResultId.push(hostContent[i].hostId);
      }
    }
    res.status(200).send({ searchResult, msg: "타입 검색이 완료되었습니다." });
  } catch (error) {
    res
      .status(400)
      .send({ searchResult, msg: "호스트 검색에 실패하였습니다.." });
  }
}

// 호스트 숙소 등록 수정
async function updateAcc(req, res) {
  const { userId, nickname, userImageURL } = res.locals;
  const { hostId } = req.params;
  try {
    const findAcc = await hosts.findOne({ where: { hostId } });
    if (userId !== findAcc.userId) {
      res.send({ errorMessage: "작성자가 아닙니다!" });
    }
    const {
      title,
      category,
      houseInfo,
      mainAddress,
      subAddress,
      stepSelect,
      stepInfo,
      link,
      hostContent,
      tagList,
      deleteImages,
    } = req.body;
    const image = req.files;
    const updatedHostAcc = await hosts.findAll({
      where: { hostId },
      include: [
        {
          model: images,
          attributes: ["thumbnailURL", "postImageURL"],
        },
      ],
    });
    const deleteinfo2 = req.body.deleteImages.replaceAll(" ", "");
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

    // S3 삭제
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
        if (err) console.log(err, err.stack);
        else {
          data;
        }
      });
    }

    await images.destroy({
      where: { postImageURL: deleteURL },
    });

    // 이미지 파일객체 map
    const postImagesKEY = image.map((postImageKey) => postImageKey.key);
    const postImagesURL = image.map((postImageUrl) => postImageUrl.location);

    // 기존 DB의 KEY, URL 획득
    const DBDeleteImagesInfo = await images.findAll({
      where: { hostId },
      attributes: ["postImageKEY", "postImageURL"],
    });

    postImagesKEY.forEach((element, i) => {
      const postImageKEY = postImagesKEY[i];
      const postImageURL = postImagesURL[i];
      images.create({
        userId: userId,
        userImageURL: userImageURL,
        nickname: nickname,
        hostId: hostId,
        thumbnailURL: DBDeleteImagesInfo[0].postImageURL,
        thumbnailKEY: DBDeleteImagesInfo[0].postImageKEY,
        postImageURL: postImageURL.toString(),
        postImageKEY: postImageKEY.toString(),
      });
    });

    let newTagStr = [];
    if (req.body.tagList) {
      const newTag = req.body.tagList.split(" ");
      newTagStr.push(newTag);

      Object.assign(updatedHostAcc, {
        tagList: newTagStr,
      });
    }
    await hosts.update(
      {
        title,
        category,
        houseInfo,
        mainAddress,
        subAddress,
        stepSelect,
        stepInfo,
        link,
        hostContent,
        tagList: newTagStr,
      },
      { where: { hostId: hostId } }
    );

    res.status(200).send({ updatedHostAcc });
  } catch {
    res.status(400).send({ msg: "호스트 수정에 실패했습니다." });
  }
}

module.exports = {
  deleteAcc,
  hostCreateAcc,
  getAllAcc,
  getDetailAcc,
  updateAcc,
  hostAddresssearch,
  hostTypesearch,
  getAllACC_Star,
  hostsearch,
};
