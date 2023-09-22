import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import "../App.css";

function FaceRecognition() {
  const videoRef = useRef(null);

  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function getLabeledFaceDescriptions() {
      const labels = ["Luis","Jose", "Daniel", "Doang"];
      return Promise.all(
        labels.map(async (label) => {
          const descriptions = [];
          for (let i = 1; i <= 2; i++) {
            const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpeg`);
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
    //   console.log(labeledFaceDescriptors)//Me retorna las carpetas
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
  }, []);

  return (
    <div>
      {/* <h1>FAce Detection</h1> */}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="600"
        height="450"
      ></video>
    </div>
  );
}

export default FaceRecognition;
