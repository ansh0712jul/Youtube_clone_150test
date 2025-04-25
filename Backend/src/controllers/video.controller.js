import User from "../models/user.model";
import VideoDataModel from "../models/video.model";
import TrendingDataModel from "../models/trends.model";
import { verifyJwt } from "../middlewares/auth.middleware";
import generateAccessToken from "../utils/generateAccessToken.js";

async function publishVideo(req, res) {
  try {
    const {
      videoTitle,
      videoDescription,
      tags,
      videoLink,
      thumbnailLink,
      video_duration,
      email,
      publishDate,
      Visibility,
    } = req.body;

    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      const userID = verifyRefreshToken(refreshToken);
      const accessToken = generateAccessToken({ id: userID });
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const user = await userData.findOne({ email });
    let videos = await videodata.findOne({ email });

    if (user) {
      user.videos.push({ videoURL: videoLink, videoLength: video_duration });
      user.thumbnails.push({ imageURL: thumbnailLink });

      const videoData = {
        thumbnailURL: thumbnailLink,
        uploader: user.channelName,
        videoURL: videoLink,
        ChannelProfile: user.profilePic,
        Title: videoTitle,
        Description: videoDescription,
        Tags: tags,
        videoLength: video_duration,
        uploaded_date: publishDate,
        visibility: Visibility,
      };

      if (!videos) {
        videos = new videodata({
          email,
          VideoData: [videoData],
        });
      } else {
        videos.VideoData.push(videoData);
      }

      await user.save();
      await videos.save();

      return res.status(200).json("Published");
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
}

async function getVideos(req, res) {
  try {
    const videos = await videodata.find({});
    const extractData = (field) =>
      videos.flatMap((video) => video.VideoData.map((data) => data[field]));

    res.json({
      thumbnailURLs: extractData("thumbnailURL"),
      videoURLs: extractData("videoURL"),
      titles: extractData("Title"),
      Uploader: extractData("uploader"),
      Profile: extractData("ChannelProfile"),
      Duration: extractData("videoLength"),
      videoID: extractData("id"),
      comments: extractData("comments"),
      views: extractData("views"),
      Likes: extractData("likes"),
      uploadDate: extractData("uploaded_date"),
      Visibility: extractData("visibility"),
      videoData: videos.flatMap((video) => video),
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
}

async function getUserVideos(req, res) {
  try {
    const email = req.params.email;
    const video = await videodata.findOne({ email });
    if (!video) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(video.VideoData);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
}

async function getUserImage(req, res) {
  try {
    const email = req.params.email;
    const user = await userData.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ channelIMG: user.profilePic });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getVideoData(req, res) {
  try {
    const { id } = req.params;
    const video = await videodata.findOne({ "VideoData._id": id });
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateView(req, res) {
  try {
    const { id } = req.params;
    const video = await videodata.findOne({ "VideoData._id": id });
    const trending = await TrendingData.findOne({ videoid: id });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === id
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    video.VideoData[videoIndex].views += 1;
    await video.save();

    if (!trending) {
      return res.status(404).json({ error: "Video not found" });
    }
    trending.views += 1;
    await trending.save();
  } catch (error) {
    res.json(error.message);
  }
}

async function getLikeVideos(req, res) {
  try {
    const email = req.params.email;
    const user = await userData.findOne({ email });
    if (!user) {
      return res.json("USER DOESN'T EXISTS");
    }
    const LikedData = user.likedVideos;
    if (LikedData.length > 0) {
      res.json(LikedData);
    } else {
      res.json("NO DATA");
    }
  } catch (error) {
    res.json(error.message);
  }
}

async function watchLater(req, res) {
  try {
    const { id, email, email2 } = req.params;
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      const userID = verifyRefreshToken(refreshToken);
      const accessToken = generateAccessToken({ id: userID });
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const video = await videodata.findOne({ "VideoData._id": id });
    const user = await userData.findOne({ email });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === id
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const WatchLater = video.VideoData[videoIndex];

    const existingSavedVideo = user.watchLater.find(
      (savedVideo) => savedVideo.savedVideoID === WatchLater._id.toString()
    );

    if (existingSavedVideo) {
      user.watchLater = user.watchLater.filter(
        (savedVideo) => savedVideo.savedVideoID !== WatchLater._id.toString()
      );

      await user.save();
      await video.save();

      return res.json("Removed");
    }

    user.watchLater.push({
      email: email2,
      videoURL: WatchLater.videoURL,
      thumbnailURL: WatchLater.thumbnailURL,
      uploader: WatchLater.uploader,
      ChannelProfile: WatchLater.ChannelProfile,
      Title: WatchLater.Title,
      videoLength: WatchLater.videoLength,
      views: WatchLater.views,
      uploaded_date: WatchLater.uploaded_date,
      savedVideoID: WatchLater._id,
      videoprivacy: WatchLater.visibility,
    });

    await user.save();
    await video.save();
    res.json("Saved");
  } catch (error) {
    res.json(error.message);
  }
}

async function checkWatchLater(req, res) {
  try {
    const { id } = req.params;
    const email = req.params.email;
    const user = await userData.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const userIndex = user.watchLater.findIndex(
      (data) => data.savedVideoID.toString() === id.toString()
    );

    if (userIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    } else {
      res.json("Found");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getWatchLater(req, res) {
  try {
    const { id } = req.params;
    const email = req.params.email;
    const user = await userData.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }
    const savedData = user.watchLater;

    if (savedData && savedData.length > 0) {
      res.json(savedData);
    } else {
      res.json({ savedData: "NO DATA" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTotalViews(req, res) {
  try {
    const email = req.params.email;
    const video = await videodata.findOne({ email });
    if (!video) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    let totalViews = 0;

    video.VideoData.forEach((video) => {
      totalViews += video.views;
    });

    res.json(totalViews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function checkTrending(req, res) {
  try {
    const { videoID, email } = req.params;
    const video = await videodata.findOne({ "VideoData._id": videoID });
    if (!video) {
      return res.status(404).json({ error: "Video doesn't exist" });
    }

    const videoIndex = video.VideoData.findIndex(
      (data) => data._id.toString() === videoID
    );

    if (videoIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }

    const mainVideo = video.VideoData[videoIndex];
    const Views = video.VideoData[videoIndex].views;
    const publish = video.VideoData[videoIndex].uploaded_date;

    const currentDate = new Date();
    const publishDate = new Date(publish);
    const timeDiffMs = currentDate - publishDate;

    const timeDiffHours = Math.round(timeDiffMs / (1000 * 60 * 60));

    const trendingVideo = await TrendingData.findOne({
      videoid: videoID,
    });

    if (timeDiffHours < 24 && Views >= 50 && !trendingVideo) {
      const trending = new TrendingData({
        email: email,
        thumbnailURL: mainVideo.thumbnailURL,
        uploader: mainVideo.uploader,
        videoURL: mainVideo.videoURL,
        ChannelProfile: mainVideo.ChannelProfile,
        Title: mainVideo.Title,
        Description: mainVideo.Description,
        videoLength: mainVideo.videoLength,
        views: mainVideo.views,
        uploaded_date: mainVideo.uploaded_date,
        videoid: mainVideo._id,
      });
      return await trending.save();
    }

    res.json("DONE");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTrendingData(req, res) {
  try {
    const { videoID } = req.params;
    const trending = await TrendingData.findOne({ videoid: videoID });
    if (!trending) {
      return res.status(404).json(false);
    }
    res.json(true);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTrending(req, res) {
  try {
    const trending = await TrendingData.find();
    if (trending.length > 0) {
      res.json(trending);
    } else {
      res.json("NO DATA");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function search(req, res) {
  try {
    const { data } = req.params;
    const video = await videodata.find();
    const users = await userData.find({}, { channelData: 1 });

    const filteredVideos = video.reduce((accumulator, element) => {
      const filteredVideoData = element.VideoData.filter((item) => {
        const includesTitle = item.Title.toLowerCase().includes(
          data.toLowerCase()
        );
        const includesTags = item.Tags.toLowerCase().includes(
          data.toLowerCase()
        );
        return includesTitle || includesTags;
      });
      if (filteredVideoData.length > 0) {
        accumulator.push(...filteredVideoData);
      }
      return accumulator;
    }, []);

    const filteredChannels = users.filter((userData) =>
      userData.channelData.some((channel) =>
        channel.channelName.toLowerCase().includes(data.toLowerCase())
      )
    );

    if (filteredVideos.length > 0 && filteredChannels.length > 0) {
      res.json({
        videoData: filteredVideos,
        channelData: filteredChannels[0].channelData,
      });
    } else if (filteredVideos.length > 0) {
      res.json({ videoData: filteredVideos });
    } else if (filteredChannels.length > 0) {
      res.json({ channelData: filteredChannels[0].channelData });
    } else {
      res.json({ videoData: "NO DATA", channelData: "NO DATA" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addPlaylist(req, res) {
  try {
    const email = req.params.email;
    const {
      playlist_name,
      playlist_privacy,
      playlist_date,
      playlist_owner,
      thumbnail,
      title,
      videoID,
      description,
      videolength,
      video_uploader,
      video_date,
      video_views,
      videoprivacy,
    } = req.body;

    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      const userID = verifyRefreshToken(refreshToken);
      const accessToken = generateAccessToken({ id: userID });
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const user = await userData.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const myPlaylists = user.Playlists;
    myPlaylists.push({
      playlist_name,
      owner_email: email,
      playlist_privacy,
      playlist_date,
      playlist_owner,
      playlist_videos: [
        {
          thumbnail,
          title,
          videoID,
          description,
          videolength,
          video_uploader,
          video_date,
          video_views,
          videoprivacy,
        },
      ],
    });

    await user.save();

    res.json(myPlaylists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getPlaylistData(req, res) {
  try {
    const email = req.params.email;
    const user = await userData.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const playlists = user.Playlists;

    if (playlists && playlists.length > 0) {
      res.json(playlists);
    } else {
      res.json("No playlists available...");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function addVideoToPlaylist(req, res) {
  try {
    const email = req.params.email;
    const {
      Id,
      thumbnail,
      title,
      videoID,
      description,
      videolength,
      video_uploader,
      video_date,
      video_views,
      videoprivacy,
    } = req.body;

    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;
    if (!refreshToken) {
      return res.status(401).json({
        message: "Unauthorized access, please login again",
      });
    }
    if (!accessToken) {
      const userID = verifyRefreshToken(refreshToken);
      const accessToken = generateAccessToken({ id: userID });
      res.cookie("accessToken", accessToken, {
        httpOnly: false,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    const user = await userData.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }
    const playlistToUpdate = user.Playlists.find(
      (playlist) => playlist._id.toString() === Id.toString()
    );

    if (!playlistToUpdate) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const isVideoExists = playlistToUpdate.playlist_videos.some(
      (video) => video.videoID === videoID
    );

    if (isVideoExists) {
      return res
        .status(409)
        .json({ error: "Video already exists in the playlist" });
    }

    const newVideo = {
      thumbnail,
      title,
      videoID,
      description,
      videolength,
      video_uploader,
      video_date,
      video_views,
      videoprivacy,
    };

    playlistToUpdate.playlist_videos.push(newVideo);
    await user.save();

    res.status(200).json({ message: "Video added to the playlist" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
