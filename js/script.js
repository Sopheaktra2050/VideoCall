//this makes sure that our code will work on different browsers
var RTCPeerConnection = window.webkitRTCPeerConnection;

//Create an account on Firebase, and use the credentials they give you in place of the following
var config = {
     apiKey: "AIzaSyARKHpGi2tOzk03G5mLNsuLM5BU1UotIwM",
    authDomain: "videocall-85118.firebaseapp.com",
    databaseURL: "https://videocall-85118.firebaseio.com",
    projectId: "videocall-85118",
    storageBucket: "videocall-85118.appspot.com",
    messagingSenderId: "972086628064",
    appId: "1:972086628064:web:ffd5d137af0d390c4d4a85",
    measurementId: "G-0H6CKS44SM"
};
firebase.initializeApp(config);

var database = firebase.database().ref();
var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId = Math.floor(Math.random() * 1000000000);
var servers = {
    'iceServers': [{
        'url': 'stun:stun.services.mozilla.com'
    }, {
        'url': 'stun:stun.l.google.com:19302'
    }]
};
var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate ? sendMessage(yourId, JSON.stringify({
    'ice': event.candidate
})) : console.log("Sent All Ice"));
pc.onaddstream = (event => friendsVideo.srcObject = event.stream);

function sendMessage(senderId, data) {
    var msg = database.push({
        sender: senderId,
        message: data
    });
    msg.remove();
}

function readMessage(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    if (sender != yourId) {
        if (msg.ice != undefined)
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type == "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
            .then(() => pc.createAnswer())
            .then(answer => pc.setLocalDescription(answer))
            .then(() => sendMessage(yourId, JSON.stringify({
                'sdp': pc.localDescription
            })));
        else if (msg.sdp.type == "answer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
};

database.on('child_added', readMessage);

function showMyFace() {
    navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        .then(stream => yourVideo.srcObject = stream)
        .then(stream => pc.addStream(stream));
}

function showFriendsFace() {
    pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => sendMessage(yourId, JSON.stringify({
            'sdp': pc.localDescription
        })));
}