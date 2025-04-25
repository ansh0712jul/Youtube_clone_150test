import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { 
  postComment, 
  likeComment, 
  heartComment, 
  getHeartComments, 
  getLikedComments, 
  getComments, 
  deleteComment 
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/:id/comments").post(verifyJwt, postComment);
router.route("/:videoId/comments/:commentId/like").post(verifyJwt, likeComment);
router.route("/:videoId/comments/:commentID/heart").post(verifyJwt, heartComment);
router.route("/:videoId/comments/hearts").get(verifyJwt, getHeartComments);
router.route("/:videoId/comments/likes").get(verifyJwt, getLikedComments);
router.route("/:id/comments").get(getComments);
router.route("/:videoId/comments/:commentId").delete(verifyJwt, deleteComment);

export default router;

