'use strict';

//audio処理用
window.AudioContext = window.AudioContext || window.webkitAudioContext; 

var micList = document.getElementById("mic_list");
var localStream = null;
var localStream1 = null;
let peer = null;
let existingCall = null;
var videoContainer = document.getElementById('container');
var localVideo = document.getElementById('local_video');

function stopVideo() {
    localVideo.pause();
    location.reload(true);
    if (localVideo.srcObject) {
      localVideo.srcObject = null;
    }
    else {
      localVideo.src = "";
    }
  
    if (localStream) {
     stopStream(localStream);
     localStream = null;
    }
}

function stopStream(stream) {
    if (!stream) {
     console.warn('NO stream');
     return;
    }
      
    var tracks = stream.getTracks();
    if (! tracks) {
     console.warn('NO tracks');
     return;
    }
  
    for (index in tracks) {
     tracks[index].stop();
    } 
}  

 function logStream(msg, stream) {
  console.log(msg + ': id=' + stream.id);

  var audioTracks = stream.getAudioTracks();
  if (audioTracks) {
   console.log('audioTracks.length=' + audioTracks.length);
   for (var i = 0; i < audioTracks.length; i++) {
    var track = audioTracks[i];
    console.log(' track.id=' + track.id);
   }
  }
}

 function clearDeviceList() {
  while(micList.lastChild) {
   micList.removeChild(micList.lastChild);
  }
}

 function addDevice(device) {
  if (device.kind === 'audioinput') {
   var id = device.deviceId;
   var label = device.label || 'microphone'; // label is available for https 
   var option = document.createElement('option');
   option.setAttribute('value', id);
   option.innerHTML = label + '(' + id + ')';;
   micList.appendChild(option);
  }
  else if (device.kind === 'audiooutput') {
    var id = device.deviceId;
    var label = device.label || 'speaker'; // label is available for https 
 
    var option = document.createElement('option');
    option.setAttribute('value', id);
    option.innerHTML = label + '(' + id + ')'; 
   }

  else {
   console.error('UNKNOWN Device kind:' + device.kind);
  }
 }


 function getDeviceList() {
  clearDeviceList();
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
   devices.forEach(function(device) {
    console.log(device.kind + ": " + device.label +
                " id = " + device.deviceId);
    addDevice(device);
   });
  })
  .catch(function(err) {
   console.error('enumerateDevide ERROR:', err);
  });
 }

 function getSelectedAudio() {
  var id = micList.options[micList.selectedIndex].value;
  return id;
 }

 function startSelectedVideoAudio(sound) {
  var audioId = getSelectedAudio();
  console.log('selected audio=' + audioId);
  var constraints = {
    audio: {
     deviceId: audioId,
     //googEchoCancellation:false, //Google用
     echoCancellation:false
    }
    };

  console.log('mediaDevice.getMedia() constraints:', constraints);

  navigator.mediaDevices.getUserMedia(
   constraints
  ).then(function(stream) {
    console.log('1streamきてる');
    logStream('selectedVideo', stream);
    //localVideo.srcObject = stream;
        //AudioContextを作成
        var context1  = new AudioContext();
        //sourceの作成
        var source1 = context1.createMediaStreamSource(stream);
        //panner の作成
        var panner1 = context1.createPanner();
        panner1.panningModel = 'HRTF';
        source1.connect(panner1);
        //StereoPannerの作成
        var StereoPanner = context1.createStereoPanner();
        panner1.connect(StereoPanner);
        StereoPanner.pan.value = sound;
      
        //peer1の作成
        var peer1 = context1.createMediaStreamDestination();
    
        StereoPanner.connect(peer1); //ココの先頭変えるよ
        localStream1 = peer1.stream;

    logStream('selectedVideo', stream);
  }).catch(function(err){
   console.error('getUserMedia Err:', err);
  });
 };

 navigator.mediaDevices.ondevicechange = function (evt) {
  console.log('mediaDevices.ondevicechange() evt:', evt);
 };


//peeridを取得
function getpeerid(id) {
    //ボタンをすべて消す　PeerIDがサーバーに残ってしまい初期化ができない
    $('#peerid-ui').hide();

    //peerオブジェクトの作成
    peer = new Peer(id,{
        key: '9373b614-604f-4fd5-b96a-919b20a7c24e',    //APIkey
        debug: 3
    });

    start();//イベント確認
}
///////////////////////


//オーディオシステムの選択
$('#start_video_button_L').click(function () {
    startSelectedVideoAudio(-1);
});

$('#start_video_button_R').click(function () {
    startSelectedVideoAudio(1);
});

$('#start_video_button_W').click(function () {
    startSelectedVideoAudio(0);
});


//peeridの選択
$('#AudioLR1').click(function () {
    getpeerid("ALR1");
    $('#callto-id').val("ln1");
});

$('#AudioLR2').click(function () {
    getpeerid("ALR2");
    $('#callto-id').val("ln2");
});

$('#AudioL1').click(function () {
    getpeerid("AL1");
    $('#callto-id').val("AUL1");
});

$('#AudioL2').click(function () {
    getpeerid("AL2");
    $('#callto-id').val("AUL2");
});

$('#AudioR1').click(function () {
    getpeerid("AR1");
    $('#callto-id').val("AUR1");
});

$('#AudioR1').click(function () {
    getpeerid("AR2");
    $('#callto-id').val("AUR2");
});

$('#AudioUserL1').click(function () {
    getpeerid("AUL1");
    $('#callto-id').val("AL1");
    isReceive = true;
});

$('#AudioUserL2').click(function () {
    getpeerid("AUL2");
    $('#callto-id').val("AL2");
    isReceive = true;
});

$('#AudioUserR1').click(function () {
    getpeerid("AUR1");
    $('#callto-id').val("AR1");
    isReceive = true;
});

$('#AudioUserR2').click(function () {
    getpeerid("AUR2");
    $('#callto-id').val("AR2");
    isReceive = true;
});


$('#random').click(function () {
    getpeerid(null);
});


//イベント id取得後じゃないと動作しない
function start() {
    //openイベント
    peer.on('open', function () {
        $('#my-id').text(peer.id);
    });

    //errorイベント
    peer.on('error', function (err) {
        alert(err.message);
        setupMakeCallUI();
    });

    //closeイベント
    peer.on('close', function () {
        alert(err.message);
        setupMakeCallUI();
    });

    //disconnectedイベント
    peer.on('disconnected', function () {
        alert(err.message);
        setupMakeCallUI();
    });

    //着信処理
    peer.on('call', function(call){
        call.answer(localStream1);
        setupCallEventHandlers(call);
    });
}


/*
///////////////open,error,close,disconnectedイベント
peer.on('open', function(){         //発火する
    $('#my-id').text(peer.id);      //Peer IDの自動作成タイム
});

peer.on('error', function(err){
    alert(err.message);
});

peer.on('close', function(){
});

peer.on('disconnected', function(){
});
//////////////////////////
*/

///////////////発信処理・切断処理・着信処理
$('#make-call').submit(function(e){
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream1); 
    setupCallEventHandlers(call);
    });

$('#end-call').click(function(){
    existingCall.close();
});


/////////////////////


//////////Callオブジェクトに必要なイベント
function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;

    
    setupEndCallUI(call);

    call.on('stream', function(stream){
        addVideo(call,stream);
        setupEndCallUI();
        $('#their-id').text(call.remoteId);
    });
    call.on('close', function(){
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
}
//////////////////////////////////


///////////video要素の再生・削除・ボタン表示
function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

function removeVideo(peerId){
    $('#'+peerId).remove();
}

function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}

function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
    $('#their-id').text(call.remoteId);
}
//////////////////////////////////////
