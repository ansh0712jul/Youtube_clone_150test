import commentData from "../models/comment.model.js";
import userData from "../models/user.model.js";
import videodata from "../models/video.model.js";
import { verifyRefreshToken, generateAccessToken } from "./user.controller.js";


export const postComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, email, channelID } = req.body;

    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      // Refresh the access token
      const userID = verifyRefreshToken(refreshToken);
      const userData = { id: userID };
      const accessToken = generateAccessToken(userData);
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const video = await videodata.find({});

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const user = await userData.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const vid = video.find((vidData) =>
      vidData.VideoData.some((data) => data._id.toString() === id)
    );

    if (!vid) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoIndex = vid.VideoData.findIndex(
      (data) => data._id.toString() === id
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const newComment = {
      username: user.channelName,
      videoid: id,
      user_profile: user.profilePic,
      comment: comment,
      channel_id: channelID,
      time: new Date().toISOString(),
      likes: 0,
      user_email: email,
    };

    vid.VideoData[videoIndex].comments.push(newComment);

    await vid.save();

    res.status(200).json({ message: "Uploaded", commentData: newComment });
  } catch (error) {
    res.json(error.message);
  }
};

export const likeComment = async (req, res) => {
  try {
    const { videoId, commentId, email } = req.params;

    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      // Refresh the access token
      const userID = verifyRefreshToken(refreshToken);
      const userData = { id: userID };
      const accessToken = generateAccessToken(userData);
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const video = await videodata.findOne({ "VideoData._id": videoId });
    const user = await userData.findOne({ email });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === videoId
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const comments = video.VideoData[videoIndex].comments;

    const commentIndex = comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = comments[commentIndex];

    const likedCommentIndex = user.likedComments.findIndex(
      (likedComment) => likedComment.comment_ID === commentId
    );

    if (likedCommentIndex === -1) {
      user.likedComments.push({ comment_ID: commentId });
      comment.likes += 1;
      await user.save();
      await video.save();
      return res
        .status(200)
        .json({ message: "Comment liked successfully", likes: comments });
    } else {
      user.likedComments.splice(likedCommentIndex, 1);
      comment.likes -= 1;
      await user.save();
      await video.save();
      return res
        .status(200)
        .json({ message: "Comment disliked successfully", likes: comments });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const heartComment = async (req, res) => {
  try {
    const { videoId, commentID } = req.params;
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      // Refresh the access token
      const userID = verifyRefreshToken(refreshToken);
      const userData = { id: userID };
      const accessToken = generateAccessToken(userData);
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const video = await videodata.findOne({ "VideoData._id": videoId });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === videoId
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const comments = video.VideoData[videoIndex].comments;
    const findComment = comments.find(
      (item) => item._id.toString() === commentID.toString()
    );

    if (findComment.heartComment === true) {
      findComment.heartComment = false;
    } else {
      findComment.heartComment = true;
    }

    await video.save();

    res.json(findComment?.heartComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHeartComments = async (req, res) => {
  try {
    const { videoId } = req.params;

    const video = await videodata.findOne({ "VideoData._id": videoId });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === videoId
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const comments = video.VideoData[videoIndex].comments;
    const heart = comments.flatMap((item) => item.heartComment);

    res.status(200).json(heart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLikedComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await videodata.findOne({ "VideoData._id": videoId });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === videoId
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const comments = video.VideoData[videoIndex].comments;

    res.json(comments);
  } catch (error) {
    res.json(error.message);
  }
};

export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await videodata.findOne({ "VideoData._id": id });
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === id
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }
    const comments = video.VideoData[videoIndex].comments;
    res.json(comments);
  } catch (error) {
    res.json(error.message);
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { videoId, commentId, email } = req.params;
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      // Refresh the access token
      const userID = verifyRefreshToken(refreshToken);
      const userData = { id: userID };
      const accessToken = generateAccessToken(userData);
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const video = await videodata.findOne({ "VideoData._id": videoId });
    const user = await userData.findOne({ email });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === videoId
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const comments = video.VideoData[videoIndex].comments;

    const existingCommentIndex = comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    if (existingCommentIndex !== -1) {
      comments.splice(existingCommentIndex, 1);
      await video.save();
      res
        .status(200)
        .json({ message: "Comment Deleted", commentData: comments });
    } else {
      return res.status(404).json({ error: "Comment not found" });
    }
  } catch (error) {
    res.json(error.message);
  }
};

