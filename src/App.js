// import logo from './logo.svg';
import './App.css';
import {useRef, useEffect, useState} from 'react' 

import io from 'socket.io-client'

const socket = io('https://f64c-2601-681-897e-e60-31ac-fc96-238e-94e9.ngrok-free.app/remote-ctrl')

function App() {
  const videoRef = useRef()

  const rtcPeerConnection = useRef(new RTCPeerConnection({
    'iceServers': [
      {url:'stun:stun01.sipphone.com'},
      {url:'stun:stun.ekiga.net'},
      {url:'stun:stun.fwdnet.net'},
      {url:'stun:stun.ideasip.com'},
      {url:'stun:stun.iptel.org'},
      {url:'stun:stun.rixtelecom.se'},
      {url:'stun:stun.schlund.de'},
      {url:'stun:stun.l.google.com:19302'},
      {url:'stun:stun1.l.google.com:19302'},
      {url:'stun:stun2.l.google.com:19302'},
      {url:'stun:stun3.l.google.com:19302'},
      {url:'stun:stun4.l.google.com:19302'},
      {url:'stun:stunserver.org'},
      {url:'stun:stun.softjoys.com'},
      {url:'stun:stun.voiparound.com'},
      {url:'stun:stun.voipbuster.com'},
      {url:'stun:stun.voipstunt.com'},
      {url:'stun:stun.voxgratia.org'},
      {url:'stun:stun.xten.com'},
      {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
      },
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


      // { 'urls': 'stun:stun:services.mozilla.com' },
      // { 'urls': 'stun:stun.l.google.com:19302' },
    ]
  }))

  const [selectedScreen, _setSelectedScreen] = useState(1)
  const selectedScreenRef = useRef(selectedScreen)

  const setSelectedScreen = newSelectedScreen => {
    selectedScreenRef.current = newSelectedScreen
    _setSelectedScreen(newSelectedScreen)
  }
  
  const handleStream = (stream) => {
    setSelectedScreen(selectedScreen)

    socket.emit('selectedScreen', selectedScreen)

    // let {width, height} = stream.getVideoTracks()[0].getSettings()

    // window.electronAPI.setSize({width, height})

    // videoRef.current.srcObject = stream
    rtcPeerConnection.current.addStream(stream)
    // videoRef.qcurrent.onloadedmetadata = (e) => videoRef.current.play()
  }

  const getUserMedia = async (constraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // rtcPeerConnection.current.addTransceiver('video')
      // rtcPeerConnection.current.getTransceivers().forEach(t => t.direction = 'recvonly')

      rtcPeerConnection.current.createOffer({
        offerToReceiveVideo: 1
      }).then(sdp => {
        rtcPeerConnection.current.setLocalDescription(sdp)
        console.log('sending offer')
        socket.emit('offer', sdp)
      })
    } catch (e) { console.log(e) }
  }

  useEffect(() => {

    const getStream = async (selectedScreen) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: selectedScreen.id,
            }
          }
        })

        handleStream(selectedScreen, stream)

      } catch (e) {
        console.log(e)
      }
    }

    // (window.electronAPI && window.electronAPI.sendScreenId((event, screenId) => {
    //   console.log('Renderer...', screenId)
    //   getStream(screenId)
    // })) || getUserMedia({ video: true, audio: false })

    getUserMedia({ video: true, audio: false })

    socket.on('offer', offerSDP => {
      console.log('received offer')
      rtcPeerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offerSDP)
      ).then(() => {
        rtcPeerConnection.current.createAnswer().then(sdp => {
          rtcPeerConnection.current.setLocalDescription(sdp)

          console.log('sending answer')
          socket.emit('answer', sdp)
        })
      })
    })

    socket.on('answer', answerSDP => {
      console.log('received answer')
      rtcPeerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answerSDP)
      )
    })

    socket.on('icecandidate', icecandidate => {
      rtcPeerConnection.current.addIceCandidate(
        new RTCIceCandidate(icecandidate)
      )
    })

    rtcPeerConnection.current.onicecandidate = (e) => {
      if (e.candidate)
        socket.emit('icecandidate', e.candidate)
    }

    rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
      console.log(e)
    }

    rtcPeerConnection.current.ontrack = (e) => {
      videoRef.current.srcObject = e.streams[0]
      videoRef.current.onloadedmetadata = (e) => videoRef.current.play()
    }

    socket.on('selectedScreen', selectedScreen => {
      setSelectedScreen(selectedScreen)
    })

  }, [])

  const handleMouseClick = (e) => socket.emit('mouse_click', {})

  const handleMouseMove = ({
    clientX, clientY
  }) => {
    socket.emit('mouse_move', {
      clientX, clientY,
      clientWidth: window.innerWidth,
      clientHeight: window.innerHeight,
    })
  }

  return (
    <div className="App">
      <>
        <div
          style={{
            display: 'block',
            backgroundColor: 'black',
            margin: 0,
          }}
          onMouseMove={handleMouseMove}
          onClick={handleMouseClick}
        >
          <video ref={videoRef} className="video">video not available</video>
        </div>
      </>
    </div>
  );
}

export default App;