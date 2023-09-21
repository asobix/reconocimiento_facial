import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

const FaceRecognition = () => {
    const videoRef = useRef(null);

    useEffect(() => {
      // Configura la ruta base para los modelos
      const modelsPath = '/models';
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
  
      const startCamera = async () => {
        const constraints = { video: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.current.srcObject = stream;
      };
  
      startCamera();
    }, []);
  
    return (
      <div>
        <video ref={videoRef} autoPlay muted width="720" height="560" />
      </div>
    );
}

export default FaceRecognition