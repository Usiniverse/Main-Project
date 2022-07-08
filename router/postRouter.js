const express = require("express");
const PostController = require("../controller/postController");
const authMiddleware = require("../middlewares/auth-middleware");
const ImageController = require("../controller/ImageController");
const ImageUploader = require("../middlewares/S3-middleware");
const router = express.Router();

// 게시글 작성 API
router.post('/', ImageUploader.fields([{ name: 'images', maxCount: 5 }]), PostController.WritePosting);


// 게시글 조회 API
router.get('/', PostController.GetPostingList);


// 게시글 상세 조회 API
router.get('/:postId', authMiddleware, PostController.GetPost);


// 게시글 수정 API(put)
router.patch('/:contentId', authMiddleware, PostController.ModifyPosting);


// ******************************************************************
// 게시글 삭제 API(email, articleId 같이 맞으면 삭제)
router.delete('/:contentId', authMiddleware, PostController.DeletePost);

// 이미지 업로드
router.post('/images', ImageUploader.array('images', 5), ImageController.PostImage)

// 이미지 가져오기
router.get('/images/:key', ImageController.GetImages)

module.exports = router;