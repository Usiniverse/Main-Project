const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const roomController = require("../controller/roomController");
const router = express.Router();

router.get("/chat/:roomId",  authMiddleware,  roomController.callchats);
router.get("/", roomController.allRoomList);
// router.get("/search/:roomId", authMiddleware, roomController.searchRoom); 검색 기능
// router.get("/search//hashTag:roomId", authMiddlewareroomController.searchRoombyhashtag); 해쉬태그 검색
router.get("/:roomId", authMiddleware, roomController.Roomdetail);
router.post("/", authMiddleware, roomController.createRoom);
router.post("/:roomId", authMiddleware, roomController.enterRoom);
router.delete("/:roomId", authMiddleware, roomController.exitRoom);
// router.delete("/:roomId", authMiddleware, roomController.kickUser);
module.exports = router;
