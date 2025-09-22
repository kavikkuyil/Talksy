const socket = io("https://talksy-kfdw.onrender.com/", { secure: true });

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const user = prompt("Enter your name");

var peer = new Peer({
  host: 'https://talksy-kfdw.onrender.com/',
  port: 443,
   secure: true,   
  path: '/peerjs',
  config: {
    'iceServers': [
      { url: 'stun:stun01.sipphone.com' },
      { url: 'stun:stun.ekiga.net' },
      { url: 'stun:stunserver.org' },
      { url: 'stun:stun.softjoys.com' },
      { url: 'stun:stun.voiparound.com' },
      { url: 'stun:stun.voipbuster.com' },
      { url: 'stun:stun.voipstunt.com' },
      { url: 'stun:stun.voxgratia.org' },
      { url: 'stun:stun.xten.com' },
      {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      },
      {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
      }
    ]
  },

  debug: 3
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, user); // Pass your username

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      // You need to get the remote user's name, e.g. from a mapping or socket event
      call.on("stream", (userVideoStream) => {
        // For now, pass "Unknown" or update logic to get remote username
        addVideoStream(video, userVideoStream, call.metadata?.userName || "Unknown");
      });
    });

    socket.on("user-connected", (userId, userName) => {
      connectToNewUser(userId, myVideoStream, userName);
    });
  });

const connectToNewUser = (userId, stream, userName) => {
  const call = peer.call(userId, stream, { metadata: { userName } });
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userName);
  });
};

peer.on("open", (id) => {
  console.log('my id is' + id);
  socket.emit("join-room", ROOM_ID, id, user);
});

function addVideoStream(video, stream, userName = "") {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    // Create a wrapper div for video and username
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "8px";
    wrapper.appendChild(video);

    // Add username below video
    const nameTag = document.createElement("span");
    nameTag.textContent = userName || "Unknown";
    nameTag.style.marginTop = "4px";
    nameTag.style.color = "#fff";
    nameTag.style.background = "rgba(44,83,100,0.22)";
    nameTag.style.padding = "2px 8px";
    nameTag.style.borderRadius = "8px";
    nameTag.style.fontSize = "0.95em";
    wrapper.appendChild(nameTag);

    videoGrid.append(wrapper);
  });
}

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

const shareScreen = document.getElementById("shareScreen");
shareScreen.addEventListener("click", async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  
    for (const track of myVideoStream.getVideoTracks()) {
      myVideoStream.removeTrack(track);
    }
    myVideoStream.addTrack(screenStream.getVideoTracks()[0]);
    addVideoStream(myVideo, screenStream);
    
    screenStream.getVideoTracks()[0].onended = () => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        addVideoStream(myVideo, stream);
      });
    };
  } catch (err) {
    alert("Screen sharing failed: " + err);
  }
});


inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messages.innerHTML +=
    `<div class="message">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>
          <b><i class="far fa-user-circle"></i> <span>${userName === user ? "me" : userName}</span></b>
          <span style="color:#e0eaff; margin-left:8px;">${message}</span>
        </span>
        <span class="timestamp">${time}</span>
      </div>
    </div>`;
  showNotification("New message from " + userName);
});

function showNotification(text) {
  const notification = document.getElementById("notification");
  notification.textContent = text;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 2000);
}

const participants = document.getElementById("participants");
socket.on("update-user-list", (users) => {
  participants.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u;
    participants.appendChild(li);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const participantsToggle = document.getElementById("participantsToggle");
  const userListSidebar = document.getElementById("userListSidebar");
  participantsToggle.addEventListener("click", () => {
    userListSidebar.classList.toggle("active");
  });

  const videoGrid = document.getElementById("video-grid");
  const reactionButton = document.getElementById("reactionButton");

  reactionButton.addEventListener("click", () => {
    // Show emoji overlay on your video
    const myVideoWrapper = videoGrid.querySelector("div"); // assumes your video is first
    if (myVideoWrapper) {
      let overlay = document.createElement("div");
      overlay.textContent = "👍";
      overlay.style.position = "absolute";
      overlay.style.top = "40%";
      overlay.style.left = "50%";
      overlay.style.transform = "translate(-50%, -50%)";
      overlay.style.fontSize = "3rem";
      overlay.style.zIndex = "100";
      overlay.style.pointerEvents = "none";
      myVideoWrapper.appendChild(overlay);
      setTimeout(() => overlay.remove(), 2000);
    }
  });

  const displayNameInput = document.getElementById("displayNameInput");

 

  const muteAllBtn = document.getElementById("muteAllBtn");
  muteAllBtn.addEventListener("click", () => {
    // Mute all local video streams (demo: mute your own)
    const videos = videoGrid.querySelectorAll("video");
    videos.forEach(video => video.muted = true);
    alert("All participants muted (demo)");
  });
});




