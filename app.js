const express = require("express");
const mysql = require("mysql");
const path = require("path");
const cors = require("cors"); // cors 패키지 연결
const morgan = require("morgan");
const passport = require("passport");
// const cookieParser = require('cookie-parser')
const UserRouter = require("./router/userRouter");
const passportConfig = require('./passport');
const PostRouter = require("./router/postRouter");
const LikeRouter = require("./router/likeRouter");
const SaveRouter = require("./router/saveRouter");
const ReviewRouter = require("./router/reviewRouter");
const CommentRouter = require("./router/commentRouter");
const RoomRouter = require("./router/roomRouter");
const ImageRouter = require("./router/imageRouter");
const HostRouter = require("./router/hostRouter");
const reqlogMiddleware = require("./middlewares/request-log-middleware");
const port = 8080;

// const session = require("express-session")
const webSocket = require("./socket");

const corsOption = {
  origin: ["http://localhost:3000", "*",
  "https://mendorong-jeju.co.kr", "https://www.mendorong-jeju.co.kr"],
  credentials: true,
};

// http://choijireact.s3-website.ap-northeast-2.amazonaws.com

//MySql
const db = require("./models");
db.sequelize
  .sync()
  .then(() => {
     console.log("MySQL DB 연결 성공");
  })
  .catch((error) => {
    console.error(error);
  });


passportConfig()

const app = express()

//body parser
app.use(morgan("dev"));
// app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));


//미들웨어 실행
app.use(reqlogMiddleware);
app.use(cors(corsOption));


// 라우터 등록
app.get('/', (req, res) => {
  res.status(200).render('index');
})

app.use("/room", RoomRouter);
app.use("/post", PostRouter, CommentRouter);
app.use("/like", LikeRouter);
app.use("/save", SaveRouter);
app.use("/image", ImageRouter);
app.use("/host", HostRouter);
app.use("/review", ReviewRouter);
app.use('/oauth', express.urlencoded({ extended: false }), UserRouter)
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
// app.use("/public", express.static(__dirname + "/public"));
// app.get("/", (_, res) => res.render("home"));
// app.get("/*", (_, res) => res.redirect("/"));

// app.set("view engine", "pug", "ejs");
// app.set("views", __dirname + "/views");
// app.use("/public", express.static(__dirname + "/public"));
// app.get("/", (_, res) => res.render("home"));
// app.get("/*", (_, res) => res.redirect("/"));


const server = app.listen(port, () => {
  console.log(port,"번 포트에서 대기 중");
});

webSocket(server, app);
