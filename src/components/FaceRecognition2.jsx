import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import './style/style.css'

function FaceRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [canvasVisible, setCanvasVisible] = useState(false);

  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraOn(true);
        setCanvasVisible(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function stopWebcam() {
    const video = videoRef.current;

    if (video) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
      setCameraOn(false);
      setCanvasVisible(false);
    }
  }

  useEffect(() => {
    async function getLabeledFaceDescriptions() {
      const labels = ["Luis", "Jose", "Daniel", "Doang"];
      return Promise.all(
        labels.map(async (label) => {
          const descriptions = [];
          for (let i = 1; i <= 2; i++) {
            const img = await faceapi.fetchImage(`/labels/${label}/${i}.jpeg`);
            const detections = await faceapi
              .detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            descriptions.push(detections.descriptor);
          }
          return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
      );
    }

    async function setupFaceRecognition() {
      const labeledFaceDescriptors = await getLabeledFaceDescriptions();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        await video.play();
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        const intervalId = setInterval(async () => {
          const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );

          // Limpia el canvas antes de dibujar nuevamente
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

          const results = resizedDetections.map((d) => {
            return faceMatcher.findBestMatch(d.descriptor);
          });
          results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
              label: result.toString(),
            });

            drawBox.draw(canvas);
          });
        }, 100);

        // Limpia el intervalo cuando se desmonta el componente
        return () => clearInterval(intervalId);
      }
    }

    async function loadModels() {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);

      startWebcam();
      setupFaceRecognition();
    }

    loadModels();

    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="container">
      <div>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width="600"
          height="450"
        ></video>
      </div>
      {canvasVisible && (
        <canvas ref={canvasRef} style={{ display: "block" }}></canvas>
      )}
      <div>
        <button onClick={startWebcam} disabled={cameraOn}>
          Encender Cámara
        </button>
        <button onClick={stopWebcam} disabled={!cameraOn}>
          Apagar Cámara
        </button>
      </div>
    </div>
  );
}

export default FaceRecognition;
