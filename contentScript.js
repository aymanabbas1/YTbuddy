let youtubeLeftControls, youtubePlayer;
let currentVideo = "";
let currentVideoBookmarks = [];

const fetchBookmarks = (callback) => {
  chrome.storage.sync.get([currentVideo], (obj) => {
    const bookmarks = obj[currentVideo] ? JSON.parse(obj[currentVideo]) : [];
    callback(bookmarks);
  });
};

const addNewBookmarkEventHandler = () => {
  const currentTime = youtubePlayer.currentTime;
  const newBookmark = {
    time: currentTime,
    desc: "Bookmark at " + getTime(currentTime),
  };

  fetchBookmarks((bookmarks) => {
    currentVideoBookmarks = bookmarks;
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
    });
  });
};

const newVideoLoaded = () => {
  const bookmarkBtnExists = document.querySelector(".bookmark-btn");

  if (!bookmarkBtnExists) {
    const bookmarkBtn = document.createElement("img");

    bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
    bookmarkBtn.className = "ytp-button bookmark-btn";
    bookmarkBtn.title = "Click to bookmark current timestamp";

    youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
    youtubePlayer = document.getElementsByClassName("video-stream")[0];
    youtubeLeftControls.appendChild(bookmarkBtn);
    bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
  }
};

const getTime = t => {
  var date = new Date(0);
  date.setSeconds(t);

  return date.toISOString().substr(11, 8);
};

chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type, value, videoId } = obj;

  if (type === "NEW") {
    currentVideo = videoId;
    newVideoLoaded();
  } else if (type === "PLAY") {
    youtubePlayer.currentTime = value;
  } else if (type === "DELETE") {
    currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
    chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

    response(currentVideoBookmarks);
  } else if (type === "TOGGLE_BLUR") {
    toggleBlurThumbnails(value);
  }
});

const toggleBlurThumbnails = (blurEnabled) => {
  const thumbnailSelector = "ytd-thumbnail";
  const thumbnails = document.querySelectorAll(thumbnailSelector);

  thumbnails.forEach((thumbnail) => {
    if (blurEnabled) {
      thumbnail.style.filter = "blur(8px)";
    } else {
      thumbnail.style.filter = "none";
    }
  });
};

const waitForPlayerAndControls = () => {
  const player = document.querySelector(".video-stream");
  const controls = document.querySelector(".ytp-left-controls");

  if (player && controls) {
    newVideoLoaded();
  } else {
    setTimeout(waitForPlayerAndControls, 500);
  }
};

waitForPlayerAndControls();
