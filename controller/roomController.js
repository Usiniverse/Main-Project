const { Rooms, Chats, sequelize, Sequelize } = require("../models");
const Op = Sequelize.Op;
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

async function allRoomList(req, res) {
  try {
    const allRoom = await Rooms.findAll({ order: [["createdAt", "DESC"]] });

    return res.status(200).send({ allRoom, msg: "룸을 조회했습니다" });
  } catch (err) {
    return res.status(400).send({ msg: "룸 조회가 되지 않았습니다." });
  }
}
async function Roomdetail(req, res) {
  const { roomId } = req.params;
  const { userId } = res.locals;
  console.log(userId);
  const Room = await Rooms.findOne({ where: { roomId: roomId } });
  let chatingRooms = await Rooms.findAll({
    where: {
      [Op.or]: [{ hostId: userId }, { roomUserId: userId }],
    }
  });
  
 
  res.status(200).send({ msg: "룸 상세조회에 성공했습니다.", chatingRooms, Room });
}

// async function keywordList(req, res) {
//   const { roomId } = req.params;
//     try {

//     const keywordRoom = await Room.findAll({
//       where: { purpose: roomPurpose },
//       attributes: { exclude: ["roomPassword"] },
//       order: [["createdAt", "DESC"]],
//       include: [
//         {
//           model: PersonInRoom,
//           as: "peopleInRoom",
//           attributes: ["userId", "createdAt", "nick"],
//           raw: true,
//         },
//       ],
//     });
//     const startedRoom = await Room.findOne({
//       attributes: [
//         [Sequelize.fn("COUNT", Sequelize.col("isStarted")), "count"],
//       ],
//       where: { purpose: roomPurpose },
//     });
//     res.status(200).send({ list: keywordRoom, startedCnt: startedRoom });
//   } catch (err) {
//     return res
//       .status(400)
//       .send({ msg: "해당 키워드의 스터디룸 리스트 조회에 실패했습니다." });
//   }
// }

async function createRoom(req, res) {
  try {
    const { title, max, hashTag } = req.body;
    const { userId, nickname, userImage } = res.locals;
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
      hostImg: userImage,
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
  const { userId, nickname, userImage } = res.locals;
  
  let room = await Rooms.findOne({ where: { roomId: roomId } });
  // try {
  if (room.hostId == userId) {
    res.status(200).send({ msg: "호스트가 입장하였습니다" });
    return;
  } else {
    for (i = 0; i < room.roomUserId.length; i++) {
      if (userId == room.roomUserId[i]) 
      res.status(200).send({ msg: "채팅방에 등록된 유저입니다" });
      return
    }
    
    room.roomUserId.push(userId);
    room.roomUserNickname.push(nickname);
    let roomUserNum = room.roomUserNickname.length + 1;
    room.roomUserImg.push(userImage);

     await Rooms.update(
       {
         roomUserId: room.roomUserId,
         roomUserImg: room.roomUserImg,
         roomUserNickname: room.roomUserNickname,
         roomUserNum: roomUserNum
       },
       { where: { roomId: roomId } }
     );
    return res.status(201).send({ msg: "입장 완료" });
  }
  }


    
//   } catch (err) {
//     res.status(400).send({
//       msg: "공개방 입장에 실패하였습니다.",
//     });
//   }
// }

async function exitRoom(req, res) {
  const { roomId } = req.params;
  const { userId } = res.locals.user;

  const room = await Rooms.findOne({ where: { roomId: roomId } });
  console.log(room.roomUserNickname, room.roomUserNickname.userId, userId);
  // const roomUserNickname = room.roomUserNickname.filter(
  //   (roomUser) => roomUser.userId !== userId
  // );

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
      (roomUsersImg) => roomUsersImg != userImg
    );
    const roomUserNum = roomUsersId.langth + 1;
    await room.update(
      { roomuserId: roomUsersId },
      { roomUserNickname: roomUsersNickname },
      { roomUserImg: roomUsersImg },
      { roomUserNum: roomUserNum }
    );
  }
}

// async function kickUser(req, res) {
//     const { userId,roomId } = req.params;

//     const room = await Rooms.findOne({ where: { roomId: roomId } });

//     if (userId !== room.hostNickname.userId) {
//         res.status(400).send({
//             msg: "강퇴기능은 룸 호스트만 사용 가능합니다."
//         })

//     }

// }

module.exports = {
  callchats,
  //   keywordList,
  allRoomList,
  createRoom,
  enterRoom,
  exitRoom,
  //   checkRoomPw,
  //   kickUser
  Roomdetail,
};
