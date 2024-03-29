const { Rooms, Chats, sequelize, Sequelize } = require("../models");
const Op = Sequelize.Op;

//룸 검색
async function searchRoom(req, res) {
  const queryData = req.query;
  const searchResult = await Rooms.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.substring]: queryData.search } },
        { hashTag: { [Op.substring]: queryData.search } },
      ],
    },
    order: [
      [{ title: { [Op.substring]: queryData.search } }, "createdAt", "DESC"],
    ],
  });
  res.status(200).send({ msg: "룸 검색완료", searchResult });
}


//룸 해쉬태그 검색
async function searchRoombyhashtag(req, res) {
  const queryData = req.query;
  const rooms = await Rooms.findAll({
    where: {
      hashTag: { [Op.substring]: queryData.search },
    },
    order: [["createdAt", "DESC"]],
  });
  res.status(200).send({ msg: "룸 해쉬태그 검색완료", rooms });
}

//룸 채팅 불러오기
async function callchats(req, res) {
  try {
    const { postId } = req.params;

    const Chats = await Chats.findAll({
      where: { postId: postId },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).send({ Chats, msg: "채팅을 불러왔습니다" });
  } catch {
    res.status(400)({ msg: "채팅을 불러오지 못했습니다." });
  }
}

//룸 전체 조회
async function allRoomList(req, res) {
  try {
    const allRoom = await Rooms.findAll({ order: [["createdAt", "DESC"]] });
    
    let tags = [];
    for (let i = 0; i < allRoom.length; i++) {
      const room = allRoom[i];
      for (let l = 0; l < room.hashTag.length; l++) {
        const hashtag = room.hashTag[l];
        tags.push(hashtag);
      }
    }

    tags = tags.reduce((accu, curr) => {
      accu[curr] = (accu[curr] || 0) + 1;
      return accu;
    }, {});
    let max = 0;
    let max2 = 0;
    let max3 = 0;
    for (let j = 0; j < Object.values(tags).length; j++) {
      if (max < Object.values(tags)[j]) {
        max = Object.values(tags)[j];
      }
      if (max2 < Object.values(tags)[j] < max) {
        max2 = Object.values(tags)[j];
      }
      if (max3 < Object.values(tags)[j] < max2) {
        max3 = Object.values(tags)[j];
      }
    }
    max = Object.keys(tags).find((key) => tags[key] === max);
    delete tags[max];
    max2 = Object.keys(tags).find((key) => tags[key] === max2);
    delete tags[max2];
    max3 = Object.keys(tags).find((key) => tags[key] === max3);
    tags = [max, max2, max3];

    return res.status(200).send({ allRoom, tags, msg: "룸을 조회했습니다" });
  } catch (err) {
    return res.status(400).send({ msg: "룸 조회가 되지 않았습니다." });
  }
}

async function Roomdetail(req, res) {
  const { roomId } = req.params;
  const { userId, nickname, userImageURL } = res.locals;
  try {
    let Room = await Rooms.findOne({ where: { roomId: Number(roomId) } });
    let loadChat = [];

    if (Room.roomUserId.includes(userId) || Room.hostId == userId) {
      loadChat = await Chats.findAll({ where: { roomId: Number(roomId) } });
    }
    let chatingRooms = await Rooms.findAll({
      where: {
        [Op.or]: [
          { roomId: Number(roomId) },
          { hostId: userId },
          { roomUserId: { [Op.substring]: userId } },
        ],
      },
    });

    for (let i = 0; i < chatingRooms.length; i++) {
      let chatRoom = chatingRooms[i];
      if (chatRoom.roomId == roomId) {
        chatingRooms[i] = chatingRooms[0];
        chatingRooms[0] = chatRoom;
      }
    }

    res
      .status(200)
      .send({ msg: "룸 상세조회에 성공했습니다.", chatingRooms, Room, loadChat });
  } catch (err) {
    res
      .status(400)
      .send({
        msg: "룸 상세조회에 성공했습니다.",
        chatingRooms,
        Room,
        loadChat,
      });
  }
}

async function createRoom(req, res) {
  try {
    const { title, max, hashTag } = req.body;
    const { userId, nickname, userImageURL } = res.locals;
    const existRoom = await Rooms.findOne({
      where: { title: title },
    });

    if (existRoom) {
      return res.status(400).send({ msg: "방이름이 중복됩니다" });
    }

    const newRoom = await Rooms.create({
      max: max,

      hashTag: hashTag,
      title: title,
      hostNickname: nickname,
      hostId: userId,
      hostImg: userImageURL,
      createdAt: Date(),
      updatedAt: Date(),
      roomUserId: [],
      roomUserNickname: [],
      roomUserNum: 1,
      roomUserImg: [],
    });

    return res.status(200).send({ msg: "완료", newRoom });
  } catch (err) {
    res.status(400).send({ msg: "룸 생성에 실패하였습니다." });
  }
}

async function enterRoom(req, res) {
  const { roomId } = req.params;
  const { userId } = res.locals;

  let room = await Rooms.findOne({ where: { roomId: Number(roomId) } });

  try {
    if (room.hostId == userId) {
      res.status(200).send({ msg: "호스트가 입장하였습니다" });
      return;
    }
    if (room.roomUserId.includes(userId)) {
      res.status(200).send({ msg: "채팅방에 등록된 유저입니다" });
      return;
    }
    if (Number(room.max) < room.roomUserId.length) {
      res.status(400).send({
        errorMEssage: "입장 가능 인원을 초과하였습니다.",
      });
      return;
    }

    res.status(201).send({ msg: "입장 완료" });
  } catch (err) {
    res.status(400).send({
      errorMEssage: "공개방 입장에 실패하였습니다.",
    });
  }
}

async function exitRoom(req, res) {
  const { roomId } = req.params;
  const { userId, nickname, userImgURL } = res.locals.user;

  const room = await Rooms.findOne({ where: { roomId: Number(roomId) } });
  console.log(room.roomUserNickname, room.roomUserNickname.userId, userId);

  if (userId === room.hostId) {
    await Chats.destroy({ roomId: roomId });
    await Rooms.destroy({ roomId: roomId });
  } else {
    const roomUsersId = room.roomuserId.filter(
      (roomUsersId) => roomUsersId != userId
    );
    const roomUsersNickname = room.roomUserNickname.filter(
      (roomUsersNickname) => roomUsersNickname != nickname
    );
    const roomUsersImg = room.roomUserImg.filter(
      (roomUsersImg) => roomUsersImg != userImgURL
    );
    const roomUserNum = roomUsersId.length + 1;
    await room.update({
      roomuserId: roomUsersId,
      roomUserNickname: roomUsersNickname,
      roomUserImg: roomUsersImg,
      roomUserNum: roomUserNum,
    });
  }
}
async function populerRoom(req, res) {
  try {
    const allRoom = await Rooms.findAll();
    allRoom.sort((a, b) => b.roomUserId.length - a.roomUserId.length);

    return res.status(200).send({ allRoom, msg: "인기룸을 조회했습니다" });
  } catch (err) {
    return res.status(400).send({ msg: "인기룸 조회가 되지 않았습니다." });
  }
}

module.exports = {
  callchats,
  searchRoom,
  allRoomList,
  createRoom,
  enterRoom,
  exitRoom,
  searchRoombyhashtag,
  Roomdetail,
  populerRoom,
};
