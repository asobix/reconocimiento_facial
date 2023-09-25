import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import './style/style.css'

function FaceRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Referencia al elemento canvas
  const [cameraOn, setCameraOn] = useState(false); // Estado para controlar si la cámara está encendida o apagada

  // Mantén un estado separado para controlar si el canvas debe mostrarse
  const [canvasVisible, setCanvasVisible] = useState(false);

  // Definir la función startWebcam antes de su uso
  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraOn(true); // Cambia el estado para indicar que la cámara está encendida
        setCanvasVisible(true); // Muestra el canvas cuando se enciende la cámara
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Definir la función stopWebcam antes de su uso
  async function stopWebcam() {
    const video = videoRef.current;

    if (video) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
      setCameraOn(false); // Cambia el estado para indicar que la cámara está apagada
      setCanvasVisible(false); // Oculta el canvas cuando se apaga la cámara
    }
  }

  useEffect(() => {
    async function getLabeledFaceDescriptions() {
      const labels = ["Luis", "Jose", "Daniel", "Doang"];
      return Promise.all(
        labels.map(async (label) => {
          const descriptions = [];
          for (let i = 1; i <= 2; i++) {
            // Usa la ruta correcta hacia la imagen en la carpeta public
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

      if (video) {
        await video.play();

        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
          const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );

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

    // Limpia la cámara y el canvas cuando el componente se desmonta
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
      <div>
        <button onClick={startWebcam} disabled={cameraOn}>
          Encender Cámara
        </button>
        <button onClick={stopWebcam} disabled={!cameraOn}>
          Apagar Cámara
        </button>
      </div>
      {/* Use el estado `canvasVisible` para controlar si se muestra el canvas */}
      {canvasVisible && (
        <canvas ref={canvasRef} style={{ display: "block" }}></canvas>
      )}
    </div>
  );
}

export default FaceRecognition;
