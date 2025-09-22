const socket = io("/"); // Connect to the same host

const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const user = prompt("Enter your name");

let myVideoStream;

// Use auto-generated Peer ID
var peer = new Peer(undefined, {
  path: '/peerjs',
  host: window.location.hostname,
  port: window.location.protocol === 'https:' ? 443 : 80,
  secure: window.location.protocol === 'https:'
});

// Get user media
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream, user);

  peer.on("call", call => {
    call.answer(stream);
    const video = document.createElement("video");
    call.on("stream", userVideoStream => {
      addVideoStream(video, userVideoStream, call.metadata?.userName || "Unknown");
    });
  });

  socket.on("user-connected", (userId, userName) => {
    connectToNewUser(userId, stream, userName);
  });
});

peer.on("open", id => {
  socket.emit("join-room", ROOM_ID, id, user);
});

function connectToNewUser(userId, stream, userName) {
  const call = peer.call(userId, stream, { metadata: { userName } });
  const video = document.createElement("video");
  call.on("stream", userVideoStream => {
    addVideoStream(video, userVideoStream, userName);
  });
}

// Add video element + username
function addVideoStream(video, stream, userName = "") {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "8px";
    wrapper.appendChild(video);

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
